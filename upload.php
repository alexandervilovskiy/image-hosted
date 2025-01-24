<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

class Upload {
    private $_allowed_types = [
        IMAGETYPE_GIF => ['function_postfix' => 'gif', 'file_format' => 'gif'],
        IMAGETYPE_JPEG => ['function_postfix' => 'jpeg', 'file_format' => 'jpg'],
        IMAGETYPE_PNG => ['function_postfix' => 'png', 'file_format' => 'png'],
        IMAGETYPE_WBMP => ['function_postfix' => 'wbmp', 'file_format' => 'wbmp'],
    ];

    private $_blacklisted_domains = ['img.swated.online'];

    public static $filename_config = [
        'base' => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        'length' => 8
    ];

    public static $upload_file_dir;

    const MAX_FILE_SIZE = '2M';

    public function __construct() {
        self::$upload_file_dir = __DIR__ . '/file/';
    }

    public function upload_urls($urls_array) {
        $array_result = [];

        foreach ($urls_array as $i => $url) {
            $is_blacklisted = false;

            foreach ($this->_blacklisted_domains as $domain_name) {
                if (strpos($url, $domain_name) !== false) {
                    $is_blacklisted = true;
                    $array_result[$i]['error']['host'] = 1;
                    break;
                }
            }

            $temp_name = tempnam(sys_get_temp_dir(), "zmg");
            $is_copied = @copy($url, $temp_name);

            $this->upload_handling($array_result[$i], $url, $temp_name, !$is_copied || $is_blacklisted);
        }

        return $array_result;
    }

    public function upload_files($files_array) {
        $array_result = [];

        foreach ($files_array['name'] as $i => $name) {
            $this->upload_handling(
                $array_result[$i],
                $name,
                $files_array['tmp_name'][$i],
                $files_array['error'][$i]
            );
        }

        return $array_result;
    }

    protected function upload_handling(&$array, $name, $temp_name, $is_error) {
        $array['error']['upload'] = 0;
        $array['error']['type'] = 0;
        $array['error']['size'] = 0;

        if ($is_error !== UPLOAD_ERR_OK) {
            $array['error']['upload'] = 1;
            return false;
        }

        $array['name'] = $name;
        list($width, $height, $type) = getimagesize($temp_name);
        $array['type'] = $type;
        $array['size']['width'] = $width;
        $array['size']['height'] = $height;
        $array['size']['filesize'] = filesize($temp_name);

        if (!$this->is_support_type($type)) {
            $array['error']['upload'] = 1;
            $array['error']['type'] = 1;
        }

        if (!$this->is_support_size($array['size']['filesize'])) {
            $array['error']['upload'] = 1;
            $array['error']['size'] = 1;
        }

        if ($array['error']['upload'] == 1) {
            return false;
        }

        do {
            $new_name = $this->get_random_name() . '.' . $this->_allowed_types[$type]['file_format'];
        } while (file_exists(self::$upload_file_dir . $new_name));

        $file_path = self::$upload_file_dir . $new_name[0] . '/' . $new_name[1] . '/';
        if (!file_exists($file_path)) {
            mkdir($file_path, 0755, true);
        }
        move_uploaded_file($temp_name, $file_path . $new_name);

        $thumb_path = self::$upload_file_dir . 'thumb/' . $new_name[0] . '/' . $new_name[1] . '/';
        if (!file_exists($thumb_path)) {
            mkdir($thumb_path, 0755, true);
        }
        $this->create_thumbnail_image($file_path . $new_name, $thumb_path . $new_name, 420);

        $array['url'] = $new_name;

        return true;
    }

    private function create_thumbnail_image($src_path, $dest_path, $new_width) {
        list($width, $height, $type) = getimagesize($src_path);

        if ($new_width >= $width) {
            copy($src_path, $dest_path);
            return;
        }

        $new_height = round($new_width * $height / $width);

        $create_function = "imagecreatefrom" . $this->_allowed_types[$type]['function_postfix'];
        $src_res = @$create_function($src_path);
        if ($src_res === false) {
            return;
        }

        $dest_res = imagecreatetruecolor($new_width, $new_height);

        imagecopyresampled($dest_res, $src_res, 0, 0, 0, 0, $new_width, $new_height, $width, $height);

        $output_function = "image" . $this->_allowed_types[$type]['function_postfix'];
        $output_function($dest_res, $dest_path);

        imagedestroy($dest_res);
        imagedestroy($src_res);
    }

    private function get_random_name() {
        $base = self::$filename_config['base'];
        $length = self::$filename_config['length'];
        $max = strlen($base) - 1;

        $result_str = '';

        for ($i = 0; $i < $length; $i++) {
            $result_str .= $base[mt_rand(0, $max)];
        }

        return $result_str;
    }

    public function is_support_size($size) {
        $is_app_support_size = $size <= $this->return_bytes(self::MAX_FILE_SIZE);
        $is_php_support_size = $size <= $this->return_bytes(ini_get('upload_max_filesize'));
        $is_post_support_size = $size <= $this->return_bytes(ini_get('post_max_size'));

        return $size !== false && $is_app_support_size && $is_php_support_size && $is_post_support_size;
    }

    public function is_support_type($type) {
        return isset($this->_allowed_types[$type]);
    }

    private function return_bytes($val) {
        $val = trim($val);
        $last = strtolower($val[strlen($val) - 1]);
        $val = (int)$val;

        switch ($last) {
            case 'g':
                $val *= 1024;
            case 'm':
                $val *= 1024;
            case 'k':
                $val *= 1024;
        }

        return $val;
    }
}

$upload = new Upload();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($_FILES['files'])) {
        $result = $upload->upload_files($_FILES['files']);
    } elseif (isset($input['urls'])) {
        $result = $upload->upload_urls($input['urls']);
    } else {
        $result = ['error' => 'No files or URLs provided'];
    }

    echo json_encode($result);
} else {
    echo json_encode(['error' => 'Invalid request method']);
}