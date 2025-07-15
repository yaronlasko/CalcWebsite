// Detect page functionality
document.addEventListener('DOMContentLoaded', function() {
    const detectForm = document.getElementById('detectForm');
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const resultsSection = document.getElementById('results');
    const resultContent = document.getElementById('resultContent');
    
    // Handle click on upload area to trigger file input
    uploadArea.addEventListener('click', function(e) {
        // Only trigger file input if we're not clicking on the file input itself
        if (e.target !== imageInput && !e.target.closest('.file-status')) {
            e.preventDefault();
            imageInput.click();
        }
    });
    
    // Handle file drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f8f9ff';
        uploadArea.style.borderColor = '#667eea';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = '#ddd';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = '#ddd';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            imageInput.files = files;
            updateUploadArea(files[0]);
        }
    });
    
    // Handle file input change
    imageInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            updateUploadArea(e.target.files[0]);
        }
    });
    
    // Prevent double clicks on file input
    imageInput.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Update upload area with selected file
    function updateUploadArea(file) {
        // Find or create the file status element
        let statusElement = uploadArea.querySelector('.file-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'file-status';
            // Insert before the file input
            uploadArea.insertBefore(statusElement, imageInput);
        }
        
        statusElement.innerHTML = `
            <p>📎 Selected: ${file.name}</p>
            <p>Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <p style="color: #667eea; font-size: 0.9rem;">Click "Analyze Image" to process or click here to select a different file</p>
        `;
        
        // Hide default text
        const defaultTexts = uploadArea.querySelectorAll('p:not(.file-status p)');
        defaultTexts.forEach(p => p.style.display = 'none');
        
        // Update styling
        uploadArea.style.backgroundColor = '#f8f9ff';
        uploadArea.style.borderColor = '#667eea';
    }
    
    // Handle form submission
    detectForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        
        // Show loading state
        resultContent.innerHTML = '<div class="loading">Processing image...</div>';
        resultsSection.style.display = 'block';
        
        fetch('/detect', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (data.success) {
                // Display successful detection results
                const results = data.results;
                let detectionHTML = `
                    <div class="result-item">
                        <h4>🦷 Calculus Detection Results</h4>
                        <div class="result-summary">
                            <p><strong>Teeth Detected:</strong> ${results.teeth_detected}</p>
                            <p><strong>Average Calculus Coverage:</strong> ${results.average_calculus_coverage}%</p>
                        </div>
                        
                        <div class="image-comparison">
                            <div class="image-container">
                                <h5>Original Image</h5>
                                <img src="${results.original_image_url}" alt="Original" class="result-image">
                            </div>
                            <div class="image-container">
                                <h5>Detection Results</h5>
                                <img src="${results.processed_image_url}" alt="Processed" class="result-image">
                            </div>
                        </div>
                        
                        <div class="individual-results">
                            <h5>Individual Tooth Analysis</h5>
                            <div class="teeth-grid">
                `;
                
                results.individual_results.forEach((tooth, index) => {
                    const severityClass = tooth.calculus_percentage > 20 ? 'high' : 
                                        tooth.calculus_percentage > 10 ? 'medium' : 'low';
                    detectionHTML += `
                        <div class="tooth-result ${severityClass}">
                            <div class="tooth-id">Tooth ${tooth.tooth_id}</div>
                            <div class="calculus-percentage">${tooth.calculus_percentage}%</div>
                            <div class="severity-label">${severityClass}</div>
                        </div>
                    `;
                });
                
                detectionHTML += `
                            </div>
                        </div>
                        
                        <div class="legend">
                            <h5>Severity Legend</h5>
                            <div class="legend-items">
                                <div class="legend-item low">
                                    <div class="legend-color"></div>
                                    <span>Low (0-10%)</span>
                                </div>
                                <div class="legend-item medium">
                                    <div class="legend-color"></div>
                                    <span>Medium (10-20%)</span>
                                </div>
                                <div class="legend-item high">
                                    <div class="legend-color"></div>
                                    <span>High (>20%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                resultContent.innerHTML = detectionHTML;
            } else {
                // Handle old format for backward compatibility
                resultContent.innerHTML = `
                    <div class="result-item">
                        <h4>Detection Results</h4>
                        <p><strong>Filename:</strong> ${data.filename}</p>
                        <p><strong>Result:</strong> ${data.result}</p>
                        <div class="placeholder-notice">
                            <p><em>Note: This is a placeholder. The actual AI model will be integrated here.</em></p>
                        </div>
                    </div>
                `;
            }
        })
        .catch(error => {
            resultContent.innerHTML = `
                <div class="error">
                    <h4>Error</h4>
                    <p>${error.message}</p>
                </div>
            `;
        });
    });
});
