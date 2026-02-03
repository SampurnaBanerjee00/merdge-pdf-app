document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const addFilesBtn = document.getElementById('addFilesBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileList = document.getElementById('fileList');
    const fileCount = document.getElementById('fileCount');
    const mergeBtn = document.getElementById('mergeBtn');
    const outputName = document.getElementById('outputName');
    const downloadLink = document.getElementById('downloadLink');
    const newMergeBtn = document.getElementById('newMergeBtn');
    const resultSection = document.getElementById('resultSection');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const sortByNameBtn = document.getElementById('sortByNameBtn');
    const reverseOrderBtn = document.getElementById('reverseOrderBtn');
    
    // State
    let pdfFiles = [];
    
    // Initialize
    updateFileList();
    
    // Event Listeners
    fileInput.addEventListener('change', handleFileSelect);
    
    addFilesBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    clearBtn.addEventListener('click', clearAllFiles);
    
    mergeBtn.addEventListener('click', mergePDFs);
    
    newMergeBtn.addEventListener('click', resetApp);
    
    document.getElementById('printPreviewBtn').addEventListener('click', () => {
        window.open(downloadLink.href, '_blank');
    });
    
    sortByNameBtn.addEventListener('click', sortFilesByName);
    
    reverseOrderBtn.addEventListener('click', reverseFileOrder);
    
    // Drag and Drop
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
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        handleFiles(files);
    }
    
    // File handling
    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }
    
    function handleFiles(files) {
        const newFiles = Array.from(files).filter(file => {
            // Check if file is PDF
            if (file.type !== 'application/pdf') {
                showToast(`"${file.name}" is not a PDF file. Skipped.`, 'warning');
                return false;
            }
            
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                showToast(`"${file.name}" is too large (max 10MB). Skipped.`, 'warning');
                return false;
            }
            
            // Check for duplicates
            const isDuplicate = pdfFiles.some(pdfFile => 
                pdfFile.name === file.name && pdfFile.size === file.size
            );
            
            if (isDuplicate) {
                showToast(`"${file.name}" is already added. Skipped.`, 'warning');
                return false;
            }
            
            return true;
        });
        
        if (newFiles.length > 0) {
            pdfFiles.push(...newFiles);
            updateFileList();
            showToast(`Added ${newFiles.length} file(s)`, 'success');
        }
        
        // Reset file input
        fileInput.value = '';
    }
    
    function updateFileList() {
        fileList.innerHTML = '';
        
        if (pdfFiles.length === 0) {
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No files selected yet. Add PDF files to get started.</p>
                </div>
            `;
            mergeBtn.disabled = true;
            fileCount.textContent = '(0 files)';
            return;
        }
        
        mergeBtn.disabled = false;
        fileCount.textContent = `(${pdfFiles.length} file${pdfFiles.length > 1 ? 's' : ''})`;
        
        pdfFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.index = index;
            
            const fileSize = formatFileSize(file.size);
            
            fileItem.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
                <div class="file-controls">
                    <button class="preview-btn" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="up-btn" title="Move up" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="down-btn" title="Move down" ${index === pdfFiles.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="remove-btn" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            fileList.appendChild(fileItem);
            
            // Add event listeners for buttons
            const previewBtn = fileItem.querySelector('.preview-btn');
            const upBtn = fileItem.querySelector('.up-btn');
            const downBtn = fileItem.querySelector('.down-btn');
            const removeBtn = fileItem.querySelector('.remove-btn');
            
            previewBtn.addEventListener('click', () => previewFile(index));
            upBtn.addEventListener('click', () => moveFile(index, 'up'));
            downBtn.addEventListener('click', () => moveFile(index, 'down'));
            removeBtn.addEventListener('click', () => removeFile(index));
        });
    }
    
    function moveFile(index, direction) {
        if (direction === 'up' && index > 0) {
            // Swap with previous file
            [pdfFiles[index], pdfFiles[index - 1]] = [pdfFiles[index - 1], pdfFiles[index]];
            updateFileList();
        } else if (direction === 'down' && index < pdfFiles.length - 1) {
            // Swap with next file
            [pdfFiles[index], pdfFiles[index + 1]] = [pdfFiles[index + 1], pdfFiles[index]];
            updateFileList();
        }
    }
    
    function removeFile(index) {
        pdfFiles.splice(index, 1);
        updateFileList();
        showToast('File removed', 'info');
    }
    
    function clearAllFiles() {
        if (pdfFiles.length === 0) return;
        
        pdfFiles = [];
        updateFileList();
        showToast('All files cleared', 'info');
    }
    
    function sortFilesByName() {
        pdfFiles.sort((a, b) => a.name.localeCompare(b.name));
        updateFileList();
        showToast('Files sorted by name', 'info');
    }
    
    function reverseFileOrder() {
        pdfFiles.reverse();
        updateFileList();
        showToast('File order reversed', 'info');
    }
    
    // PDF Merging
    async function mergePDFs() {
        if (pdfFiles.length === 0) return;
        
        // Show progress
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        try {
            // Create a new PDF document
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            // Get merge options
            const pageOrder = document.querySelector('input[name="pageOrder"]:checked').value;
            
            // Process each PDF file
            for (let i = 0; i < pdfFiles.length; i++) {
                const file = pdfFiles[i];
                
                // Update progress
                const progress = Math.round((i / pdfFiles.length) * 100);
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
                
                // Read file as array buffer
                const arrayBuffer = await file.arrayBuffer();
                
                // Load the PDF
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                
                // Copy pages
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                // Add pages based on order setting
                if (pageOrder === 'sequential') {
                    // Add all pages from this PDF
                    pages.forEach(page => {
                        mergedPdf.addPage(page);
                    });
                } else if (pageOrder === 'alternate') {
                    // For alternate pages, we need a different approach
                    // We'll implement this later if needed
                    // For now, just add sequentially
                    pages.forEach(page => {
                        mergedPdf.addPage(page);
                    });
                }
            }
            
            // Finalize progress
            progressBar.style.width = '100%';
            progressText.textContent = '100%';
            
            // Save the merged PDF
            const mergedPdfBytes = await mergedPdf.save();
            
            // Create blob and download link
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            // Update download link
            const filename = outputName.value || 'merged-document.pdf';
            if (!filename.toLowerCase().endsWith('.pdf')) {
                filename += '.pdf';
            }
            
            downloadLink.href = url;
            downloadLink.download = filename;
            
            // Show result section
            resultSection.style.display = 'block';
            
            // Scroll to result
            resultSection.scrollIntoView({ behavior: 'smooth' });
            
            // Update result message
            document.getElementById('resultMessage').textContent = 
                `Successfully merged ${pdfFiles.length} PDF file${pdfFiles.length > 1 ? 's' : ''}.`;
            
            showToast('PDFs merged successfully!', 'success');
            
        } catch (error) {
            console.error('Error merging PDFs:', error);
            showToast(`Error merging PDFs: ${error.message}`, 'error');
            
            // Hide progress
            progressContainer.style.display = 'none';
        }
    }
    
    // Reset app
    function resetApp() {
        pdfFiles = [];
        updateFileList();
        resultSection.style.display = 'none';
        progressContainer.style.display = 'none';
        outputName.value = 'merged-document.pdf';
        
        // Clear any existing object URLs
        if (downloadLink.href && downloadLink.href.startsWith('blob:')) {
            URL.revokeObjectURL(downloadLink.href);
        }
        
        showToast('Ready for new merge', 'info');
    }
    
    // Helper functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        
        // Set color based on type
        if (type === 'success') {
            toast.style.backgroundColor = '#38a169';
        } else if (type === 'warning') {
            toast.style.backgroundColor = '#d69e2e';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#e53e3e';
        } else {
            toast.style.backgroundColor = '#2d3748';
        }
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Preview functionality
    function previewFile(index) {
        const file = pdfFiles[index];
        const url = URL.createObjectURL(file);
        document.getElementById('pdfPreview').src = url;
        document.getElementById('previewModal').style.display = 'block';
    }
    
    // Modal event listeners
    const modal = document.getElementById('previewModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        URL.revokeObjectURL(document.getElementById('pdfPreview').src);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            URL.revokeObjectURL(document.getElementById('pdfPreview').src);
        }
    });
    
    // Prevent dragging files outside the drop area
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
    });
});