// Test annotation page functionality
document.addEventListener('DOMContentLoaded', function() {
    const imageGrid = document.getElementById('imageGrid');
    const currentUserSpan = document.getElementById('currentUser');
    
    // Get user ID from URL
    const pathParts = window.location.pathname.split('/');
    const userId = pathParts[pathParts.length - 1];
    
    if (!userId || isNaN(userId)) {
        alert('Invalid user ID');
        window.location.href = '/test';
        return;
    }
    
    currentUserSpan.textContent = `User ${userId}`;
    
    // Initialize annotation modal
    const annotationModal = new AnnotationModal();
    
    // Load images for user
    loadUserImages(userId);
    
    function loadUserImages(userId) {
        imageGrid.innerHTML = '<div class="loading">Loading images...</div>';
        
        fetch(`/api/test/images/${userId}`)
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
            imageGrid.innerHTML = '<div class="no-images">All images completed! Great job!</div>';
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
            saveAnnotation(imageData, maskData, userId);
        });
    }
    
    function saveAnnotation(imageData, maskData, userId) {
        const payload = {
            maskData: maskData,
            userId: userId
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
            loadUserImages(userId);
        })
        .catch(error => {
            console.error('Error saving annotation:', error);
            alert('Error saving annotation: ' + error.message);
        });
    }
});
