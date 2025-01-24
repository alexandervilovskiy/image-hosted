// script.js
document.addEventListener('DOMContentLoaded', () => {
  let dropArea = document.getElementById('drop-area');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
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

  async function uploadFile(file) {
    let url = '/upload.php'; // Измените на ваш API endpoint
    let formData = new FormData();
    formData.append('files[]', file);

    try {
      let response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      let result = await response.json();
      console.log('Success:', result);
      updateGallery(result);
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading file: ' + error.message);
    }
  }

  function previewFile(file) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function() {
      let img = document.createElement('img');
      img.src = reader.result;
      img.style.maxWidth = '200px';
      document.getElementById('gallery').appendChild(img);
    };
  }

  async function uploadFromUrl() {
    let url = document.getElementById('imageUrl').value;
    if (!url) {
      alert('Please enter an image URL.');
      return;
    }

    try {
      let response = await fetch('/upload.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: [url] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      let result = await response.json();
      console.log('Success:', result);
      updateGallery(result);
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading image from URL: ' + error.message);
    }
  }

  function updateGallery(result) {
    let gallery = document.getElementById('gallery');
    result.forEach(item => {
      if (!item.error) {
        let img = document.createElement('img');
        img.src = '/file/' + item.url[0] + '/' + item.url[1] + '/' + item.url;
        img.alt = item.name;
        gallery.appendChild(img);
        updateMainImage(img.src);
      } else {
        console.error('Error uploading:', item.name, item.error);
        alert('Error uploading ' + item.name + ': ' + item.error);
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

  // Экспорт функции handleFiles в глобальную область видимости
  window.handleFiles = handleFiles;
});
