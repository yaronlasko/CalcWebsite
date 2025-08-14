// Annotation functionality shared between test and direct annotation
class AnnotationTool {
    constructor(imageCanvas, annotationCanvas) {
        this.imageCanvas = imageCanvas;
        this.annotationCanvas = annotationCanvas;
        this.imageCtx = imageCanvas.getContext('2d');
        this.annotationCtx = annotationCanvas.getContext('2d');
        
        this.isDrawing = false;
        this.brushSize = 10;
        this.currentImage = null;
        this.brushIndicator = null;
        this.zoomLevel = 1;
        this.canvasWrapper = null;
        
        // Pan state
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        
        // Mode state
        this.mode = 'paint'; // 'paint' or 'move'
        
        this.setupEventListeners();
        this.createBrushIndicator();
        this.setupZoomControls();
        this.setupModeControls();
    }
    
    setupEventListeners() {
        // Mouse events
        this.annotationCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.annotationCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.annotationCanvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.annotationCanvas.addEventListener('mouseout', this.handleMouseUp.bind(this));
        
        // Touch events for mobile
        this.annotationCanvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.annotationCanvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.annotationCanvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Brush cursor (only show in paint mode)
        this.annotationCanvas.addEventListener('mousemove', this.updateBrushCursor.bind(this));
        this.annotationCanvas.addEventListener('mouseenter', this.showBrushCursor.bind(this));
        this.annotationCanvas.addEventListener('mouseleave', this.hideBrushCursor.bind(this));
        
        // Wheel zoom
        this.annotationCanvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Context menu prevention
        this.annotationCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    createBrushIndicator() {
        this.brushIndicator = document.createElement('div');
        this.brushIndicator.className = 'brush-indicator';
        this.brushIndicator.style.display = 'none';
        document.body.appendChild(this.brushIndicator);
    }
    
    updateBrushCursor(e) {
        if (this.brushIndicator && this.mode === 'paint') {
            const rect = this.annotationCanvas.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            // Brush size should scale with zoom level for visual accuracy
            const scaledSize = this.brushSize * 2 * this.zoomLevel;
            this.brushIndicator.style.left = x + 'px';
            this.brushIndicator.style.top = y + 'px';
            this.brushIndicator.style.width = scaledSize + 'px';
            this.brushIndicator.style.height = scaledSize + 'px';
            this.brushIndicator.style.display = 'block';
        }
    }
    
    showBrushCursor() {
        if (this.brushIndicator && this.mode === 'paint') {
            this.brushIndicator.style.display = 'block';
        }
        this.updateCursor();
    }
    
    hideBrushCursor() {
        if (this.brushIndicator) {
            this.brushIndicator.style.display = 'none';
        }
        this.updateCursor();
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.annotationCanvas.dispatchEvent(mouseEvent);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const coords = this.getCanvasCoordinates(e);
        const scaledX = coords.x;
        const scaledY = coords.y;
        
        this.annotationCtx.globalCompositeOperation = 'source-over';
        // Save annotation with full alpha (1.0) but display with transparency
        this.annotationCtx.fillStyle = 'rgba(255, 0, 0, 1.0)';
        this.annotationCtx.beginPath();
        this.annotationCtx.arc(scaledX, scaledY, this.brushSize, 0, 2 * Math.PI);
        this.annotationCtx.fill();
        
        // Store previous position for smooth drawing
        if (this.lastX !== undefined && this.lastY !== undefined) {
            this.annotationCtx.beginPath();
            this.annotationCtx.moveTo(this.lastX, this.lastY);
            this.annotationCtx.lineTo(scaledX, scaledY);
            this.annotationCtx.lineWidth = this.brushSize * 2;
            this.annotationCtx.lineCap = 'round';
            this.annotationCtx.strokeStyle = 'rgba(255, 0, 0, 1.0)';
            this.annotationCtx.stroke();
        }
        
        this.lastX = scaledX;
        this.lastY = scaledY;
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.lastX = undefined;
        this.lastY = undefined;
    }
    
    setBrushSize(size) {
        this.brushSize = size;
        this.updateBrushIndicatorSize();
    }
    
    clearCanvas() {
        this.annotationCtx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);
    }
    
    loadImage(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                
                // Calculate display dimensions (max 800px width, maintain aspect ratio)
                const maxWidth = 800;
                const maxHeight = 600;
                let displayWidth = img.width;
                let displayHeight = img.height;
                
                if (displayWidth > maxWidth) {
                    displayHeight = (displayHeight * maxWidth) / displayWidth;
                    displayWidth = maxWidth;
                }
                
                if (displayHeight > maxHeight) {
                    displayWidth = (displayWidth * maxHeight) / displayHeight;
                    displayHeight = maxHeight;
                }
                
                // Set canvas dimensions
                this.imageCanvas.width = displayWidth;
                this.imageCanvas.height = displayHeight;
                this.annotationCanvas.width = displayWidth;
                this.annotationCanvas.height = displayHeight;
                
                // Set canvas style dimensions
                this.imageCanvas.style.width = displayWidth + 'px';
                this.imageCanvas.style.height = displayHeight + 'px';
                this.annotationCanvas.style.width = displayWidth + 'px';
                this.annotationCanvas.style.height = displayHeight + 'px';
                
                // Set canvas wrapper dimensions to match the canvases
                const canvasWrapper = this.getCanvasWrapper();
                if (canvasWrapper) {
                    canvasWrapper.style.width = displayWidth + 'px';
                    canvasWrapper.style.height = displayHeight + 'px';
                }
                
                // Draw image on image canvas
                this.imageCtx.drawImage(img, 0, 0, displayWidth, displayHeight);
                
                // Clear annotation canvas and set display opacity
                this.clearCanvas();
                this.annotationCanvas.style.opacity = '0.6';
                
                resolve();
            };
            img.onerror = reject;
            img.src = imageSrc;
        });
    }
    
    getAnnotationData() {
        return {
            maskData: this.annotationCanvas.toDataURL('image/png'),
            canvasWidth: this.annotationCanvas.width,
            canvasHeight: this.annotationCanvas.height,
            timestamp: new Date().toISOString()
        };
    }
    
    destroy() {
        if (this.brushIndicator) {
            document.body.removeChild(this.brushIndicator);
        }
    }
    
    setupZoomControls() {
        // Find zoom controls
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        const zoomReset = document.getElementById('zoomReset');
        
        if (zoomSlider && zoomValue && zoomReset) {
            // Zoom slider
            zoomSlider.addEventListener('input', (e) => {
                const zoom = parseFloat(e.target.value) / 100;
                this.setZoom(zoom);
                zoomValue.textContent = Math.round(zoom * 100) + '%';
            });
            
            // Zoom reset
            zoomReset.addEventListener('click', () => {
                this.panOffsetX = 0;
                this.panOffsetY = 0;
                this.setZoom(1);
                zoomSlider.value = 100;
                zoomValue.textContent = '100%';
            });
        }
    }
    
    setZoom(zoom) {
        this.zoomLevel = zoom;
        this.updateCanvasTransform();
        
        // Update brush indicator size
        this.updateBrushIndicatorSize();
    }
    
    updateBrushIndicatorSize() {
        if (this.brushIndicator) {
            const scaledSize = this.brushSize * 2 * this.zoomLevel;
            this.brushIndicator.style.width = scaledSize + 'px';
            this.brushIndicator.style.height = scaledSize + 'px';
        }
    }
    
    handleMouseDown(e) {
        e.preventDefault();
        
        if (this.mode === 'paint' && e.button === 0) { // Left click in paint mode
            this.isDrawing = true;
            this.lastX = undefined;
            this.lastY = undefined;
            this.draw(e);
        } else if (this.mode === 'move' && e.button === 0) { // Left click in move mode
            this.isPanning = true;
            this.panStartX = e.clientX;
            this.panStartY = e.clientY;
            this.annotationCanvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseMove(e) {
        if (this.isDrawing && this.mode === 'paint') {
            this.draw(e);
        } else if (this.isPanning && this.mode === 'move') {
            this.handlePan(e);
        }
    }
    
    handleMouseUp(e) {
        if (this.isDrawing) {
            this.stopDrawing();
        }
        if (this.isPanning) {
            this.stopPanning();
        }
    }
    
    handlePan(e) {
        const deltaX = e.clientX - this.panStartX;
        const deltaY = e.clientY - this.panStartY;
        
        this.panOffsetX += deltaX;
        this.panOffsetY += deltaY;
        
        this.updateCanvasTransform();
        
        this.panStartX = e.clientX;
        this.panStartY = e.clientY;
    }
    
    stopPanning() {
        this.isPanning = false;
        this.annotationCanvas.style.cursor = '';
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.annotationCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.25, Math.min(3, this.zoomLevel + delta));
        
        // Calculate zoom center offset
        const zoomFactor = newZoom / this.zoomLevel;
        this.panOffsetX = mouseX - (mouseX - this.panOffsetX) * zoomFactor;
        this.panOffsetY = mouseY - (mouseY - this.panOffsetY) * zoomFactor;
        
        this.setZoom(newZoom);
        
        // Update zoom controls
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        if (zoomSlider && zoomValue) {
            zoomSlider.value = newZoom * 100;
            zoomValue.textContent = Math.round(newZoom * 100) + '%';
        }
    }
    
    updateCanvasTransform() {
        const canvasWrapper = this.getCanvasWrapper();
        if (canvasWrapper) {
            canvasWrapper.style.transform = `scale(${this.zoomLevel}) translate(${this.panOffsetX / this.zoomLevel}px, ${this.panOffsetY / this.zoomLevel}px)`;
        }
    }
    
    getCanvasWrapper() {
        if (!this.canvasWrapper) {
            this.canvasWrapper = this.annotationCanvas.parentElement;
            if (!this.canvasWrapper || !this.canvasWrapper.classList.contains('canvas-wrapper')) {
                this.canvasWrapper = document.getElementById('canvasWrapper');
            }
            if (!this.canvasWrapper) {
                this.canvasWrapper = document.querySelector('.canvas-wrapper');
            }
        }
        return this.canvasWrapper;
    }
    
    setupModeControls() {
        const paintModeBtn = document.getElementById('paintMode');
        const moveModeBtn = document.getElementById('moveMode');
        
        if (paintModeBtn && moveModeBtn) {
            paintModeBtn.addEventListener('click', () => {
                this.setMode('paint');
            });
            
            moveModeBtn.addEventListener('click', () => {
                this.setMode('move');
            });
        }
    }
    
    setMode(mode) {
        this.mode = mode;
        
        // Update button states
        const paintModeBtn = document.getElementById('paintMode');
        const moveModeBtn = document.getElementById('moveMode');
        
        if (paintModeBtn && moveModeBtn) {
            if (mode === 'paint') {
                paintModeBtn.classList.add('active');
                paintModeBtn.classList.remove('btn-secondary');
                paintModeBtn.classList.add('btn-primary');
                moveModeBtn.classList.remove('active');
                moveModeBtn.classList.add('btn-secondary');
                moveModeBtn.classList.remove('btn-primary');
            } else {
                moveModeBtn.classList.add('active');
                moveModeBtn.classList.remove('btn-secondary');
                moveModeBtn.classList.add('btn-primary');
                paintModeBtn.classList.remove('active');
                paintModeBtn.classList.add('btn-secondary');
                paintModeBtn.classList.remove('btn-primary');
            }
        }
        
        this.updateCursor();
    }
    
    updateCursor() {
        if (this.mode === 'paint') {
            this.annotationCanvas.style.cursor = 'none';
            if (this.brushIndicator) {
                this.brushIndicator.style.display = 'block';
            }
        } else {
            this.annotationCanvas.style.cursor = 'grab';
            if (this.brushIndicator) {
                this.brushIndicator.style.display = 'none';
            }
        }
    }
    
    getCanvasCoordinates(e) {
        const rect = this.annotationCanvas.getBoundingClientRect();
        const canvasWrapper = this.getCanvasWrapper();
        
        // Get mouse position relative to the canvas container
        const containerRect = canvasWrapper.parentElement.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        
        // Account for canvas wrapper transform (zoom and pan)
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2 - containerRect.left;
        const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2 - containerRect.top;
        
        // Calculate position relative to canvas center, accounting for zoom and pan
        const relativeX = (mouseX - wrapperCenterX) / this.zoomLevel;
        const relativeY = (mouseY - wrapperCenterY) / this.zoomLevel;
        
        // Convert to canvas coordinates
        const canvasX = relativeX + this.annotationCanvas.width / 2;
        const canvasY = relativeY + this.annotationCanvas.height / 2;
        
        return { x: canvasX, y: canvasY };
    }
}

// Modal functionality
class AnnotationModal {
    constructor() {
        this.modal = document.getElementById('annotationModal');
        this.closeBtn = document.getElementById('closeModal');
        this.brushSizeSlider = document.getElementById('brushSize');
        this.brushSizeValue = document.getElementById('brushSizeValue');
        this.clearBtn = document.getElementById('clearCanvas');
        this.saveBtn = document.getElementById('saveAnnotation');
        
        this.imageCanvas = document.getElementById('imageCanvas');
        this.annotationCanvas = document.getElementById('annotationCanvas');
        
        this.annotationTool = null;
        this.currentImageData = null;
        this.onSave = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        
        this.brushSizeSlider.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.brushSizeValue.textContent = size;
            if (this.annotationTool) {
                this.annotationTool.setBrushSize(size);
            }
        });
        
        this.clearBtn.addEventListener('click', () => {
            if (this.annotationTool) {
                this.annotationTool.clearCanvas();
            }
        });
        
        this.saveBtn.addEventListener('click', () => this.saveAnnotation());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.modal.style.display === 'block') {
                if (e.key === 'Escape') this.close();
                if (e.key === 'Enter' && e.ctrlKey) this.saveAnnotation();
            }
        });
    }
    
    open(imageData, onSave) {
        this.currentImageData = imageData;
        this.onSave = onSave;
        
        this.modal.style.display = 'block';
        
        // Wait for modal to be visible before initializing
        setTimeout(() => {
            // Initialize annotation tool
            this.annotationTool = new AnnotationTool(this.imageCanvas, this.annotationCanvas);
            this.annotationTool.setBrushSize(parseInt(this.brushSizeSlider.value));
            
            // Load image
            this.annotationTool.loadImage(imageData.path)
                .catch(error => {
                    console.error('Error loading image:', error);
                    alert('Error loading image: ' + error.message);
                    this.close();
                });
        }, 100);
    }
    
    close() {
        this.modal.style.display = 'none';
        if (this.annotationTool) {
            this.annotationTool.destroy();
            this.annotationTool = null;
        }
        this.currentImageData = null;
        this.onSave = null;
    }
    
    saveAnnotation() {
        if (!this.annotationTool || !this.currentImageData) {
            alert('No annotation to save');
            return;
        }
        
        const maskData = this.annotationTool.getAnnotationData();
        
        if (this.onSave) {
            this.onSave(this.currentImageData, maskData);
        }
        
        this.close();
    }
}
