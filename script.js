let dropArea = document.getElementById('drop-area');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults (e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropArea.classList.add('highlight');
}

function unhighlight(e) {
  dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  let dt = e.dataTransfer;
  let files = dt.files;

  handleFiles(files);
}

function handleFiles(files) {
  files = [...files];
  files.forEach(uploadFile);
  files.forEach(previewFile);
}

function uploadFile(file) {
  let url = 'upload.php';
  let formData = new FormData();

  formData.append('files[]', file);

  fetch(url, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(result => {
    console.log('Success:', result);
    updateGallery(result);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function previewFile(file) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function() {
    let img = document.createElement('img');
    img.src = reader.result;
    document.getElementById('gallery').appendChild(img);
  }
}

function uploadFromUrl() {
  let url = document.getElementById('imageUrl').value;
  fetch('upload.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({urls: [url]}),
  })
  .then(response => response.json())
  .then(result => {
    console.log('Success:', result);
    updateGallery(result);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}
function updateGallery(result) {
    let gallery = document.getElementById('gallery');
    result.forEach(item => {
      if (!item.error) {
        let img = document.createElement('img');
        let imagePath = 'file/' + item.url[0] + '/' + item.url[1] + '/' + item.url;
        img.src = imagePath;
        img.alt = item.name;
        gallery.appendChild(img);
        
        // Обновляем основное изображение и мета-тег og:image
        updateMainImage(imagePath);
      } else {
        console.error('Error uploading:', item.name, item.error);
      }
    });
  }
  
  function updateMainImage(imagePath) {
    let mainImage = document.getElementById('uploadedImage');
    let ogImageMeta = document.getElementById('ogImageMeta');
    
    mainImage.src = imagePath;
    mainImage.style.display = 'block';
    
    ogImageMeta.content = window.location.origin + '/' + imagePath;
  }
function updateGallery(result) {
  let gallery = document.getElementById('gallery');
  result.forEach(item => {
    if (!item.error) {
      let img = document.createElement('img');
      img.src = 'file/' + item.url[0] + '/' + item.url[1] + '/' + item.url;
      img.alt = item.name;
      gallery.appendChild(img);
    } else {
      console.error('Error uploading:', item.name, item.error);
    }
  });
}