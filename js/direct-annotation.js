// Direct annotation page functionality
document.addEventListener('DOMContentLoaded', function() {
    const imageGrid = document.getElementById('imageGrid');
    
    // Initialize annotation modal
    const annotationModal = new AnnotationModal();
    
    // Load images for annotation
    loadImages();
    
    function loadImages() {
        imageGrid.innerHTML = '<div class="loading">Loading images...</div>';
        
        fetch('/api/annotate/images')
            .then(response => response.json())
            .then(images => {
                displayImages(images);
            })
            .catch(error => {
                console.error('Error loading images:', error);
                imageGrid.innerHTML = '<div class="error">Error loading images</div>';
            });
    }
    
    function displayImages(images) {
        if (images.length === 0) {
            imageGrid.innerHTML = '<div class="no-images">All images have been annotated!</div>';
            return;
        }
        
        imageGrid.innerHTML = '';
        
        images.forEach(image => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${image.path}" alt="${image.name}" onerror="this.src='/static/placeholder.jpg'">
                <div class="image-item-info">
                    <h4>${image.name}</h4>
                    <p>ID: ${image.id}</p>
                </div>
            `;
            
            imageItem.addEventListener('click', () => {
                openAnnotationModal(image);
            });
            
            imageGrid.appendChild(imageItem);
        });
    }
    
    function openAnnotationModal(image) {
        annotationModal.open(image, (imageData, maskData) => {
            saveAnnotation(imageData, maskData);
        });
    }
    
    function saveAnnotation(imageData, maskData) {
        const payload = {
            maskData: maskData
        };
        
        fetch(`/api/annotations/${imageData.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            alert('Annotation saved successfully!');
            
            // Reload images to update the list
            loadImages();
        })
        .catch(error => {
            console.error('Error saving annotation:', error);
            alert('Error saving annotation: ' + error.message);
        });
    }
});
