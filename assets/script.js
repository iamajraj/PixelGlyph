const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const fileNameEl = document.getElementById('file-name');
const dropZone = document.getElementById('drop-zone');
const generateButton = document.getElementById('regenerate-button');
const asciiOutputEl = document.getElementById('ascii-output');
const densitySlider = document.getElementById('density');
const densityValue = document.getElementById('density-value');
const copyButton = document.getElementById('copy-button');
const downloadButton = document.getElementById('download-button');
const charSetSelect = document.getElementById('char-set');
const customCharsInput = document.getElementById('custom-chars');
const invertCheckbox = document.getElementById('invert');

let sourceImageDataUrl = null;
let imageAspectRatio = 1;
let lastAsciiResult = '';

// Character Sets
const charSets = {
    'standard': "@%#*+=-:. ",
    'complex': "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
    'blocks': "█▓▒░ ",
    'binary': "01 ",
    'custom': "" // Custom characters entered by user
};

// Canvas & ASCII Generation
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimize for frequent reads

function imageToAscii(imageDataUrl, options) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const density = parseInt(options.density) || 100;
                const charSetName = options.charSet || 'standard';
                let chars = charSets[charSetName] || charSets['standard'];
                if (charSetName === 'custom') {
                    chars = options.customChars || charSets['standard'];
                    if (chars.length < 2) chars = charSets['standard'];
                }
                const inverted = options.inverted || false;

                // Calculate dimensions based on density (max width approach)
                const maxAsciiWidth = density;
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                imageAspectRatio = aspectRatio; // Store for output wrapper
                let asciiWidth = maxAsciiWidth;
                let asciiHeight = Math.round(asciiWidth / aspectRatio * 0.5);

                // Clamp height if it gets too small or large relative to width
                asciiHeight = Math.max(10, Math.min(asciiHeight, maxAsciiWidth * 1.5));
                 // Recalculating width based on clamped height to maintain overall aspect
                 asciiWidth = Math.round(asciiHeight * aspectRatio * 2.0);
                 asciiWidth = Math.max(10, Math.min(asciiWidth, maxAsciiWidth * 1.5));


                canvas.width = asciiWidth;
                canvas.height = asciiHeight;
                ctx.drawImage(img, 0, 0, asciiWidth, asciiHeight);

                const imageData = ctx.getImageData(0, 0, asciiWidth, asciiHeight);
                const data = imageData.data;
                let asciiString = '';

                for (let y = 0; y < asciiHeight; y++) {
                    for (let x = 0; x < asciiWidth; x++) {
                        const offset = (y * asciiWidth + x) * 4;
                        const r = data[offset];
                        const g = data[offset + 1];
                        const b = data[offset + 2];
                        // Simple grayscale brightness (Luma formula variation)
                        let brightness = 0.299 * r + 0.587 * g + 0.114 * b;
                        if (inverted) {
                            brightness = 255 - brightness;
                        }
                        const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
                        // Ensure index is within bounds
                        const safeIndex = Math.max(0, Math.min(chars.length - 1, charIndex));
                        asciiString += chars[safeIndex];
                    }
                    asciiString += '\n'; // New line for each row
                }
                 // Need to Adjust output font size dynamically (TODO: need to experiment with this)
                 const outputWrapper = document.getElementById('ascii-output-wrapper');
                 if(outputWrapper) {
                    const maxSize = 16; // Max font size
                    const minSize = 1; // Min font size
                    const targetWidth = outputWrapper.clientWidth;
                    // Estimate character width based on font size
                    let fontSize = Math.min(maxSize, Math.max(minSize, (targetWidth / asciiWidth) * 0.8 ));
                    asciiOutputEl.style.fontSize = `${fontSize}px`;
                 }

                resolve(asciiString);
            } catch (error) {
                console.error("Error during ASCII conversion:", error);
                reject("Failed to convert image to ASCII.");
            }
        };
        img.onerror = () => {
            reject("Failed to load image.");
        };
        img.src = imageDataUrl;
    });
}

async function generateAndUpdateOutput() {
    if (!sourceImageDataUrl) return;

    asciiOutputEl.textContent = 'Processing...';
    asciiOutputEl.classList.add('placeholder');

    const options = {
        density: densitySlider.value,
        charSet: charSetSelect.value,
        customChars: customCharsInput.value,
        inverted: invertCheckbox.checked
    };

    try {
        const asciiResult = await imageToAscii(sourceImageDataUrl, options);
        lastAsciiResult = asciiResult; // Store result
        asciiOutputEl.textContent = asciiResult;
        asciiOutputEl.classList.remove('placeholder');
        enableExportButtons();
    } catch (error) {
        asciiOutputEl.textContent = `Error: ${error}`;
         asciiOutputEl.classList.add('placeholder');
        disableExportButtons();
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedGenerate = debounce(generateAndUpdateOutput, 250); // Debounce slider input

// Event Listeners
function handleFileSelect(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            sourceImageDataUrl = e.target.result;
            imagePreview.src = sourceImageDataUrl;
            imagePreview.classList.remove('hidden');
            fileNameEl.textContent = file.name;
            generateButton.disabled = false;
            triggerGeneration(); // Initial generation
        }
        reader.readAsDataURL(file);
    } else {
        alert('Please select a valid image file.');
        sourceImageDataUrl = null;
        imagePreview.classList.add('hidden');
        fileNameEl.textContent = '';
        generateButton.disabled = true;
         disableExportButtons();
         asciiOutputEl.textContent = 'Invalid file type. Please upload an image.';
         asciiOutputEl.classList.add('placeholder');
    }
}

imageUpload?.addEventListener('change', (event) => {
    handleFileSelect(event.target.files[0]);
});

// Drag and Drop
dropZone?.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});
dropZone?.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    handleFileSelect(event.dataTransfer.files[0]);
});

// Controls listeners
densitySlider?.addEventListener('input', (event) => {
    densityValue.textContent = event.target.value;
    debouncedGenerate(); // Use debounced version
});
charSetSelect?.addEventListener('change', (event) => {
     customCharsInput.classList.toggle('hidden', event.target.value !== 'custom');
     triggerGeneration();
});
customCharsInput?.addEventListener('input', triggerGeneration); // Update on custom input change
invertCheckbox?.addEventListener('change', triggerGeneration);
generateButton?.addEventListener('click', triggerGeneration); // manual regeneration

function triggerGeneration() {
    if (sourceImageDataUrl) {
        generateAndUpdateOutput();
    }
}

// Enable/Disable Export Buttons
function enableExportButtons() {
    copyButton.disabled = false;
    downloadButton.disabled = false;
}
function disableExportButtons() {
     copyButton.disabled = true;
     downloadButton.disabled = true;
}


// Copy & Download Logic
copyButton?.addEventListener('click', () => {
    if (lastAsciiResult) {
        navigator.clipboard.writeText(lastAsciiResult).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => { copyButton.textContent = 'Copy'; }, 1500);
        }).catch(err => console.error('Copy failed:', err));
    }
});

downloadButton?.addEventListener('click', () => {
     if (lastAsciiResult) {
        const blob = new Blob([lastAsciiResult], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixelglyph_art_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

// Disable export initially
disableExportButtons();