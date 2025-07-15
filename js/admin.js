// Admin page functionality
document.addEventListener('DOMContentLoaded', function() {
    const refreshBtn = document.getElementById('refreshBtn');
    const testImagesList = document.getElementById('testImagesList');
    const annotateAnnotationsDiv = document.getElementById('annotateAnnotations');
    const testCountSpan = document.getElementById('testCount');
    const annotateCountSpan = document.getElementById('annotateCount');
    const totalCountSpan = document.getElementById('totalCount');
    
    const imageModal = document.getElementById('imageModal');
    const closeModal = document.getElementById('closeImageModal');
    const modalImage = document.getElementById('modalImage');
    const modalImageId = document.getElementById('modalImageId');
    const modalUser = document.getElementById('modalUser');
    const modalSource = document.getElementById('modalSource');
    const modalTimestamp = document.getElementById('modalTimestamp');
    
    // New modal for image annotations
    const imageAnnotationsModal = document.getElementById('imageAnnotationsModal');
    const closeImageAnnotationsModal = document.getElementById('closeImageAnnotationsModal');
    const modalImageName = document.getElementById('modalImageName');
    const imageAnnotationsGrid = document.getElementById('imageAnnotationsGrid');
    
    let allAnnotations = { test: [], annotate: [] };
    
    // Load annotations on page load
    loadAnnotations();
    
    // Refresh button
    refreshBtn.addEventListener('click', loadAnnotations);
    
    // Modal close handlers
    closeModal.addEventListener('click', () => {
        imageModal.style.display = 'none';
    });
    
    closeImageAnnotationsModal.addEventListener('click', () => {
        imageAnnotationsModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
        if (e.target === imageAnnotationsModal) {
            imageAnnotationsModal.style.display = 'none';
        }
    });
    
    function loadAnnotations() {
        fetch('/api/admin/annotations')
            .then(response => response.json())
            .then(data => {
                allAnnotations = data;
                displayAnnotations(data);
            })
            .catch(error => {
                console.error('Error loading annotations:', error);
            });
    }
    
    function displayAnnotations(data) {
        const testAnnotations = data.test || [];
        const annotateAnnotations = data.annotate || [];
        
        // Update counts
        testCountSpan.textContent = testAnnotations.length;
        annotateCountSpan.textContent = annotateAnnotations.length;
        totalCountSpan.textContent = testAnnotations.length + annotateAnnotations.length;
        
        // Load and display test images with annotation counts
        loadTestImages();
        
        // Display annotate annotations (keep existing functionality)
        if (annotateAnnotations.length === 0) {
            annotateAnnotationsDiv.innerHTML = '<div class="empty-state">No annotate annotations found</div>';
        } else {
            annotateAnnotationsDiv.innerHTML = '';
            annotateAnnotations.forEach(annotation => {
                const annotationElement = createAnnotationElement(annotation);
                annotateAnnotationsDiv.appendChild(annotationElement);
            });
        }
    }
    
    function loadTestImages() {
        fetch('/api/admin/test-images')
            .then(response => response.json())
            .then(images => {
                displayTestImages(images);
            })
            .catch(error => {
                console.error('Error loading test images:', error);
                testImagesList.innerHTML = '<div class="empty-state">Error loading test images</div>';
            });
    }
    
    function displayTestImages(images) {
        if (images.length === 0) {
            testImagesList.innerHTML = '<div class="empty-state">No test images found</div>';
            return;
        }
        
        testImagesList.innerHTML = '';
        
        images.forEach(image => {
            // Count annotations for this image
            const testAnnotations = allAnnotations.test || [];
            const annotationsForImage = testAnnotations.filter(annotation => 
                annotation.originalImage === image.name || 
                annotation.imageId === image.id
            );
            
            const imageElement = document.createElement('div');
            imageElement.className = 'image-item';
            imageElement.innerHTML = `
                <img src="${image.path}" alt="${image.name}" class="image-preview">
                <div class="image-info">
                    <h4>${image.name}</h4>
                    <div class="image-meta">ID: ${image.id}</div>
                    <div class="image-meta">Annotations: ${annotationsForImage.length}</div>
                </div>
            `;
            
            imageElement.addEventListener('click', () => {
                showImageAnnotations(image, annotationsForImage);
            });
            
            testImagesList.appendChild(imageElement);
        });
    }
    
    function showImageAnnotations(image, annotations) {
        modalImageName.textContent = image.name;
        
        if (annotations.length === 0) {
            imageAnnotationsGrid.innerHTML = '<div class="empty-state">No annotations found for this image</div>';
        } else {
            imageAnnotationsGrid.innerHTML = '';
            
            annotations.forEach(annotation => {
                const annotationElement = document.createElement('div');
                annotationElement.className = 'annotation-item';
                
                const timestamp = new Date(annotation.timestamp).toLocaleString();
                
                annotationElement.innerHTML = `
                    <img src="/uploads/annotations/${annotation.filename}" alt="Annotation" class="annotation-preview">
                    <div class="annotation-info">
                        <h4>User ${annotation.userId}</h4>
                        <div class="annotation-meta">Created: ${timestamp}</div>
                        <div class="annotation-meta">File: ${annotation.filename}</div>
                        <span class="user-badge">User: ${annotation.userId}</span>
                        <span class="source-badge ${annotation.source}">${annotation.source}</span>
                    </div>
                `;
                
                annotationElement.addEventListener('click', () => {
                    // Close the image annotations modal first
                    imageAnnotationsModal.style.display = 'none';
                    // Then show the individual annotation modal
                    showAnnotationModal(annotation);
                });
                
                imageAnnotationsGrid.appendChild(annotationElement);
            });
        }
        
        imageAnnotationsModal.style.display = 'block';
    }
    
    function createAnnotationElement(annotation) {
        const div = document.createElement('div');
        div.className = 'annotation-item';
        
        const timestamp = new Date(annotation.timestamp).toLocaleString();
        
        div.innerHTML = `
            <img src="/uploads/annotations/${annotation.filename}" alt="Annotation" class="annotation-preview">
            <div class="annotation-info">
                <h4>${annotation.imageId}</h4>
                <div class="annotation-meta">Created: ${timestamp}</div>
                <div class="annotation-meta">File: ${annotation.filename}</div>
                <span class="user-badge">User: ${annotation.userId}</span>
                <span class="source-badge ${annotation.source}">${annotation.source}</span>
            </div>
        `;
        
        div.addEventListener('click', () => {
            showAnnotationModal(annotation);
        });
        
        return div;
    }
    
    function showAnnotationModal(annotation) {
        modalImageId.textContent = annotation.imageId;
        modalUser.textContent = annotation.userId;
        modalSource.textContent = annotation.source;
        modalTimestamp.textContent = new Date(annotation.timestamp).toLocaleString();
        
        // Create a canvas to overlay the annotation on the original image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // First load the original image
        const originalImg = new Image();
        originalImg.crossOrigin = 'anonymous';
        originalImg.onload = function() {
            // Set canvas dimensions
            canvas.width = originalImg.width;
            canvas.height = originalImg.height;
            
            // Draw original image
            ctx.drawImage(originalImg, 0, 0);
            
            // Load and draw annotation with transparency
            const annotationImg = new Image();
            annotationImg.crossOrigin = 'anonymous';
            annotationImg.onload = function() {
                // Set global alpha for transparency
                ctx.globalAlpha = 0.6;
                ctx.drawImage(annotationImg, 0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 1.0; // Reset alpha
                
                // Set the canvas result as the modal image
                modalImage.src = canvas.toDataURL();
                
                // Reset zoom and pan when new image loads
                adminZoomLevel = 1;
                adminPanOffsetX = 0;
                adminPanOffsetY = 0;
                adminZoomSlider.value = 100;
                adminZoomValue.textContent = '100%';
                updateAdminTransform();
                
                // Auto-fit image to modal if it's too large
                fitImageToModal();
            };
            annotationImg.onerror = function() {
                console.error('Error loading annotation image');
                modalImage.src = originalImg.src; // Fallback to original image
            };
            annotationImg.src = `/uploads/annotations/${annotation.filename}`;
        };
        
        originalImg.onerror = function() {
            console.error('Error loading original image:', originalImagePath);
            console.log('Annotation data:', annotation);
            // Fallback: just show the annotation
            modalImage.src = `/uploads/annotations/${annotation.filename}`;
        };
        
        // Get original image path based on annotation source
        // Handle cases where originalImage field might be missing
        let originalImagePath = '';
        if (annotation.originalImage) {
            // New annotations have originalImage field
            if (annotation.source === 'test') {
                originalImagePath = `/uploads/test-images/${annotation.originalImage}`;
            } else {
                originalImagePath = `/uploads/annotate-images/${annotation.originalImage}`;
            }
        } else {
            // Fallback for old annotations without originalImage field
            // Try to guess the original image name from the imageId
            if (annotation.source === 'test') {
                // For test images, we'll try a few common patterns
                // Since we don't know the exact filename, we'll use a placeholder
                // and let the error handler deal with it
                originalImagePath = `/uploads/test-images/placeholder.jpg`;
            } else {
                // For annotate images, similar approach
                originalImagePath = `/uploads/annotate-images/placeholder.jpg`;
            }
        }
        
        originalImg.src = originalImagePath;
        
        imageModal.style.display = 'block';
    }
    
    // Admin zoom functionality
    let adminZoomLevel = 1;
    let adminPanOffsetX = 0;
    let adminPanOffsetY = 0;
    let adminIsPanning = false;
    let adminPanStartX = 0;
    let adminPanStartY = 0;
    
    const adminImageWrapper = document.getElementById('adminImageWrapper');
    const adminZoomSlider = document.getElementById('adminZoomSlider');
    const adminZoomValue = document.getElementById('adminZoomValue');
    const adminZoomReset = document.getElementById('adminZoomReset');
    
    function setupAdminZoom() {
        if (adminZoomSlider && adminZoomValue && adminZoomReset && adminImageWrapper) {
            // Zoom slider
            adminZoomSlider.addEventListener('input', (e) => {
                setAdminZoom(parseInt(e.target.value));
            });
            
            // Zoom reset
            adminZoomReset.addEventListener('click', () => {
                adminPanOffsetX = 0;
                adminPanOffsetY = 0;
                setAdminZoom(100);
                adminZoomSlider.value = 100;
            });
            
            // Mouse wheel zoom with center on cursor
            adminImageWrapper.addEventListener('wheel', (e) => {
                e.preventDefault();
                
                const rect = adminImageWrapper.getBoundingClientRect();
                const containerRect = adminImageWrapper.parentElement.getBoundingClientRect();
                
                // Get mouse position relative to the image wrapper
                const mouseX = e.clientX - containerRect.left;
                const mouseY = e.clientY - containerRect.top;
                
                const delta = e.deltaY > 0 ? -10 : 10;
                const oldZoom = adminZoomLevel;
                const newZoom = Math.max(25, Math.min(300, adminZoomLevel * 100 + delta)) / 100;
                
                if (newZoom !== oldZoom) {
                    // Calculate zoom center offset
                    const zoomFactor = newZoom / oldZoom;
                    
                    // Adjust pan offset to keep zoom centered on mouse
                    adminPanOffsetX = mouseX - (mouseX - adminPanOffsetX) * zoomFactor;
                    adminPanOffsetY = mouseY - (mouseY - adminPanOffsetY) * zoomFactor;
                    
                    adminZoomLevel = newZoom;
                    updateAdminTransform();
                    
                    if (adminZoomSlider) {
                        adminZoomSlider.value = Math.round(newZoom * 100);
                    }
                    
                    if (adminZoomValue) {
                        adminZoomValue.textContent = `${Math.round(newZoom * 100)}%`;
                    }
                }
            });
            
            // Pan functionality
            adminImageWrapper.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Left click
                    adminIsPanning = true;
                    adminPanStartX = e.clientX;
                    adminPanStartY = e.clientY;
                    adminImageWrapper.style.cursor = 'grabbing';
                    e.preventDefault();
                }
            });
            
            document.addEventListener('mousemove', (e) => {
                if (adminIsPanning) {
                    const deltaX = e.clientX - adminPanStartX;
                    const deltaY = e.clientY - adminPanStartY;
                    
                    adminPanOffsetX += deltaX;
                    adminPanOffsetY += deltaY;
                    
                    updateAdminTransform();
                    
                    adminPanStartX = e.clientX;
                    adminPanStartY = e.clientY;
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (adminIsPanning) {
                    adminIsPanning = false;
                    adminImageWrapper.style.cursor = 'grab';
                }
            });
            
            // Set initial cursor
            adminImageWrapper.style.cursor = 'grab';
        }
    }
    
    function setAdminZoom(zoomPercent) {
        adminZoomLevel = zoomPercent / 100;
        updateAdminTransform();
        
        if (adminZoomValue) {
            adminZoomValue.textContent = `${Math.round(zoomPercent)}%`;
        }
    }
    
    function updateAdminTransform() {
        if (adminImageWrapper) {
            adminImageWrapper.style.transform = `scale(${adminZoomLevel}) translate(${adminPanOffsetX / adminZoomLevel}px, ${adminPanOffsetY / adminZoomLevel}px)`;
        }
    }
    
    // Function to auto-fit large images to the modal window
    function fitImageToModal() {
        if (modalImage && adminImageWrapper) {
            modalImage.onload = function() {
                const modalContent = document.querySelector('.modal-content');
                const modalRect = modalContent.getBoundingClientRect();
                
                // Get available space (subtract padding and other elements)
                const availableWidth = modalRect.width - 40; // 20px padding each side
                const availableHeight = modalRect.height - 200; // Space for header, controls, etc.
                
                const imageWidth = modalImage.naturalWidth;
                const imageHeight = modalImage.naturalHeight;
                
                // Calculate scale to fit
                const scaleX = availableWidth / imageWidth;
                const scaleY = availableHeight / imageHeight;
                const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
                
                if (scale < 1) {
                    const zoomPercent = Math.round(scale * 100);
                    adminZoomLevel = scale;
                    adminZoomSlider.value = zoomPercent;
                    adminZoomValue.textContent = `${zoomPercent}%`;
                    updateAdminTransform();
                }
            };
        }
    }
    
    // Setup admin zoom when modal opens
    setupAdminZoom();
});
