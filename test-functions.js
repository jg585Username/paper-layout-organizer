let showAlignmentLines = false;
// Global current unit state; initially "inch"
let currentUnit = "inch";

const conversionFactors = {
    px: 1,
    cm: 10,
    mm: 1,
    inch: 25
};

// Functions to update scale info displays.
function updateScaleInfo() {
    document.getElementById("paperScaleInfo").textContent = `Scale: 1 ${currentUnit} = ${conversionFactors[currentUnit]} px`;
    document.getElementById("frameScaleInfo").textContent = `Scale: 1 ${currentUnit} = ${conversionFactors[currentUnit]} px`;
}
function updateMarginScaleInfo() {
    document.getElementById("marginScaleInfo").textContent = `Scale: 1 ${currentUnit} = ${conversionFactors[currentUnit]} px`;
}
updateScaleInfo();
updateMarginScaleInfo();

function syncUnits(newUnit) {
    if (newUnit === currentUnit) return;
    const oldUnit = currentUnit;
    currentUnit = newUnit;
    // Conversion ratio from old unit to new unit.
    const ratio = conversionFactors[oldUnit] / conversionFactors[newUnit];

    // Update paper dimensions.
    const paperWidthInput = document.getElementById("paperWidth");
    const paperHeightInput = document.getElementById("paperHeight");
    const oldPaperWidth = parseFloat(paperWidthInput.value);
    const oldPaperHeight = parseFloat(paperHeightInput.value);
    const actualPaperWidthPx = oldPaperWidth * conversionFactors[oldUnit];
    const actualPaperHeightPx = oldPaperHeight * conversionFactors[oldUnit];
    const newPaperWidthValue = actualPaperWidthPx / conversionFactors[newUnit];
    const newPaperHeightValue = actualPaperHeightPx / conversionFactors[newUnit];
    paperWidthInput.value = newPaperWidthValue;
    paperHeightInput.value = newPaperHeightValue;
    paper.style.width = actualPaperWidthPx + "px";
    paper.style.height = actualPaperHeightPx + "px";

    // Update frame tracker dimensions.
    const rows = document.querySelectorAll("#frameList tr");
    rows.forEach(row => {
        const unitCell = row.cells[3];
        unitCell.textContent = newUnit;
        const frameId = row.id.replace("-row", "");
        const frameElem = document.getElementById(frameId);
        if (frameElem) {
            const origWidthPx = parseFloat(frameElem.dataset.origWidth);
            const origHeightPx = parseFloat(frameElem.dataset.origHeight);
            const newWidthDisplayed = origWidthPx / conversionFactors[newUnit];
            const newHeightDisplayed = origHeightPx / conversionFactors[newUnit];
            row.cells[1].textContent = newWidthDisplayed;
            row.cells[2].textContent = newHeightDisplayed;
        }
    });

    // Update margin input.
    const marginInput = document.getElementById("marginInput");
    const oldMargin = parseFloat(marginInput.value);
    marginInput.value = oldMargin * ratio; // multiply by ratio to convert
    document.getElementById("paperUnit").value = newUnit;
    document.getElementById("frameUnit").value = newUnit;
    document.getElementById("marginUnit").value = newUnit;
    updateScaleInfo();
    updateMarginScaleInfo();
    updateAllFrameSizeDisplays();
}

document.getElementById("paperUnit").addEventListener("change", function() {
    syncUnits(this.value);
});
document.getElementById("frameUnit").addEventListener("change", function() {
    syncUnits(this.value);
});
document.getElementById("marginUnit").addEventListener("change", function() {
    syncUnits(this.value);
});

const paper = document.getElementById("paper");
const frameList = document.getElementById("frameList");
let frameCount = 0;
let frameHistory = [];

function addFrameDataAttributes(frame, widthPx, heightPx) {
    frame.dataset.origWidth = widthPx;
    frame.dataset.origHeight = heightPx;
}

function generateUniqueId(base) {
    let id = base;
    let counter = 1;
    while (document.getElementById(id)) {
        id = base + "-" + counter;
        counter++;
    }
    return id;
}

function updateFrameId(oldId, newId) {
    const frame = document.getElementById(oldId);
    if (frame) frame.id = newId;
    const row = document.getElementById(oldId + "-row");
    if (row) {
        row.id = newId + "-row";
        const deleteBtn = row.querySelector(".delete-btn");
        if (deleteBtn) {
            deleteBtn.setAttribute("data-frame-id", newId);
        }
        const slider = row.querySelector(".rotate-slider");
        if (slider) {
            slider.setAttribute("data-frame-id", newId);
        }
        const idCell = row.querySelector(".frame-id-cell");
        if (idCell) {
            idCell.setAttribute("data-frame-id", newId);
        }
    }
    const index = frameHistory.indexOf(oldId);
    if (index !== -1) {
        frameHistory[index] = newId;
    }
}

document.getElementById("setPaperSize").addEventListener("click", () => {
    const paperWidthInput = document.getElementById("paperWidth").value;
    const paperHeightInput = document.getElementById("paperHeight").value;
    const actualWidthPx = paperWidthInput * conversionFactors[currentUnit];
    const actualHeightPx = paperHeightInput * conversionFactors[currentUnit];
    paper.style.width = actualWidthPx + "px";
    paper.style.height = actualHeightPx + "px";
});

document.getElementById("addFrame").addEventListener("click", () => {
    const frameNameInput = document.getElementById("frameName").value.trim();
    const frameWidthInput = document.getElementById("frameWidth").value;
    const frameHeightInput = document.getElementById("frameHeight").value;
    const factor = conversionFactors[currentUnit];
    frameCount++;
    let baseName = frameNameInput ? frameNameInput : "frame-" + frameCount;
    let frameId = generateUniqueId(baseName);

    const widthPx = frameWidthInput * factor;
    const heightPx = frameHeightInput * factor;

    const frame = document.createElement("div");
    frame.classList.add("frame");
    frame.id = frameId;
    frame.style.width = widthPx + "px";
    frame.style.height = heightPx + "px";
    frame.style.left = "0px";
    frame.style.top = "0px";
    frame.style.transform = "rotate(0deg)";
    paper.appendChild(frame);
    addFrameDataAttributes(frame, widthPx, heightPx);
    makeDraggable(frame);
    frameHistory.push(frameId);

    const row = document.createElement("tr");
    row.id = frameId + "-row";
    row.innerHTML = `
      <td class="frame-id-cell" contenteditable="true" data-frame-id="${frameId}">${frameId}</td>
      <td class="dim-cell">${frameWidthInput}</td>
      <td class="dim-cell">${frameHeightInput}</td>
      <td>${currentUnit}</td>
      <td>
        <input type="range" min="0" max="360" value="0" data-frame-id="${frameId}" class="rotate-slider">
        <span class="rotate-value">0°</span>
            <div class="rotation-buttons">
      <button class="rotate-btn" data-angle="90" data-frame-id="${frameId}">90°</button>
      <button class="rotate-btn" data-angle="180" data-frame-id="${frameId}">180°</button>
      <button class="rotate-btn" data-angle="270" data-frame-id="${frameId}">270°</button>
    </div>
      </td>
      <td><button class="delete-btn" data-frame-id="${frameId}">Delete</button></td>
    `;
    frameList.appendChild(row);
// Add this after creating the rotation buttons
    const rotationButtons = row.querySelectorAll(".rotate-btn");
    rotationButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const angle = parseInt(this.getAttribute("data-angle"));
            const frameId = this.getAttribute("data-frame-id");
            const frame = document.getElementById(frameId);

            // Update the frame rotation
            frame.style.transform = `rotate(${angle}deg)`;

            // Update the slider and display value to match
            const slider = row.querySelector(".rotate-slider");
            const rotateValue = row.querySelector(".rotate-value");
            slider.value = angle;
            rotateValue.textContent = `${angle}°`;

            // If you have alignment lines, update them
            if (typeof showAlignmentLines !== 'undefined' && showAlignmentLines) {
                setTimeout(generateAlignmentLines, 100);
            }
        });
    });

    const deleteBtn = row.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", function () {
        const currentFrameId = this.getAttribute("data-frame-id");
        deleteFrame(currentFrameId);
    });

    const rotateSlider = row.querySelector(".rotate-slider");
    const rotateValue = row.querySelector(".rotate-value");
    rotateSlider.addEventListener("input", (e) => {
        const angle = e.target.value;
        frame.style.transform = `rotate(${angle}deg)`;
        rotateValue.textContent = `${angle}°`;
    });

    const idCell = row.querySelector(".frame-id-cell");
    idCell.addEventListener("blur", function () {
        const oldId = this.getAttribute("data-frame-id");
        const newIdCandidate = this.textContent.trim();
        if (newIdCandidate && newIdCandidate !== oldId) {
            const uniqueId = generateUniqueId(newIdCandidate);
            this.textContent = uniqueId;
            updateFrameId(oldId, uniqueId);
        } else if (!newIdCandidate) {
            this.textContent = oldId;
        }
    });

    const widthCell = row.cells[1];
    const heightCell = row.cells[2];
    widthCell.contentEditable = "true";
    heightCell.contentEditable = "true";
    widthCell.addEventListener("keypress", allowOnlyNumbers);
    heightCell.addEventListener("keypress", allowOnlyNumbers);
    widthCell.addEventListener("paste", filterPaste);
    heightCell.addEventListener("paste", filterPaste);
    widthCell.addEventListener("blur", function() {
        const newWidth = parseFloat(this.textContent);
        if (!isNaN(newWidth)) {
            const newWidthPx = newWidth * conversionFactors[currentUnit];
            const frameElem = document.getElementById(row.id.replace("-row", ""));
            if (frameElem) {
                frameElem.style.width = newWidthPx + "px";
                frameElem.dataset.origWidth = newWidthPx;
                updateFrameSizeDisplay(frameElem);
            }
        } else {
            this.textContent = frameWidthInput;
        }
    });
    heightCell.addEventListener("blur", function() {
        const newHeight = parseFloat(this.textContent);
        if (!isNaN(newHeight)) {
            const newHeightPx = newHeight * conversionFactors[currentUnit];
            const frameElem = document.getElementById(row.id.replace("-row", ""));
            if (frameElem) {
                frameElem.style.height = newHeightPx + "px";
                frameElem.dataset.origHeight = newHeightPx;
                updateFrameSizeDisplay(frameElem);
            }
        } else {
            this.textContent = frameHeightInput;
        }
    });
    updateFrameSizeDisplay(frame);
});

function allowOnlyNumbers(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (["ArrowLeft", "ArrowRight", "Backspace", "Delete"].includes(e.key)) return;
    const currentValue = e.target.textContent || "";
    if (e.key === "-" || e.key === "–") {
        e.preventDefault();
        return;
    }
    if (/[0-9]/.test(e.key)) return;
    if (e.key === "." && currentValue.indexOf(".") === -1) return;
    e.preventDefault();
}

// Updated filterPaste function
function filterPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    const filtered = text.replace(/[^0-9.]/g, "");
    document.execCommand("insertText", false, filtered);
}

function deleteFrame(frameId) {
    const frame = document.getElementById(frameId);
    if (frame) paper.removeChild(frame);
    const row = document.getElementById(frameId + "-row");
    if (row) frameList.removeChild(row);
    frameHistory = frameHistory.filter(id => id !== frameId);setTimeout(generateAlignmentLines, 100);
}

document.getElementById("deleteAllFrames").addEventListener("click", () => {
    while (paper.firstChild) {
        paper.removeChild(paper.firstChild);
    }
    frameList.innerHTML = "";
    frameHistory = [];
    frameCount = 0;clearAlignmentLines();
});

document.getElementById("undoAction").addEventListener("click", () => {
    if (frameHistory.length > 0) {
        const lastFrameId = frameHistory.pop();
        deleteFrame(lastFrameId);
    } else {
        alert("No actions to undo.");
    }
});

document.getElementById('organizeBtn').addEventListener('click', function() {
    organizeFrames();
    if (showAlignmentLines) {
        generateAlignmentLines();
        generateCuttingGuidelines();
    }
});
function organizeFrames() {
    const marginInputVal = parseFloat(document.getElementById("marginInput").value) || 0;
    const margin = marginInputVal * conversionFactors[currentUnit];
    const allowRotation = document.getElementById("allowRotation").checked;

    // Gather frames data
    const frameElements = Array.from(document.getElementsByClassName("frame"));
    const frames = frameElements.map(frame => {
        const origW = parseFloat(frame.dataset.origWidth);
        const origH = parseFloat(frame.dataset.origHeight);
        return {
            element: frame,
            origWidth: origW,
            origHeight: origH,
            rawWidth: origW,
            rawHeight: origH
        };
    });

    // Sort frames by area in descending order for better packing
    frames.sort((a, b) => (b.origWidth * b.origHeight) - (a.origWidth * a.origHeight));

    // Maximal Rectangles packing algorithm
    function maximalRectanglesPacking(binWidth) {
        // Deep copy frames array to work with
        const layoutFrames = JSON.parse(JSON.stringify(frames));

        // Initialize with a single maximal rectangle covering the entire bin
        const freeRectangles = [{
            x: margin,
            y: margin,
            width: binWidth - 2*margin,
            height: Number.MAX_SAFE_INTEGER
        }];

        let binHeight = margin; // Start with margin at the top
        let maxRightEdge = margin; // Track the rightmost edge of all placed frames

        // Place each frame
        layoutFrames.forEach(frame => {
            // Find best position for this frame
            const placement = findBestPlacement(frame, freeRectangles, allowRotation, margin);

            if (placement) {
                // Apply the placement (positions already include margin space)
                frame.posX = placement.x;
                frame.posY = placement.y;
                frame.usedWidth = placement.width;
                frame.usedHeight = placement.height;
                frame.rotated = placement.rotated;

                // Update bin height - add margin to placement height for boundary
                binHeight = Math.max(binHeight, placement.y + placement.height + margin);

                // Update max right edge
                maxRightEdge = Math.max(maxRightEdge, placement.x + placement.width + margin);

                // Update free rectangles - note that we include margin in the space taken
                placeRectangle({
                    x: placement.x - margin,  // Expand by margin for spacing
                    y: placement.y - margin,  // Expand by margin for spacing
                    width: placement.width + 2*margin,  // Add margins on both sides
                    height: placement.height + 2*margin  // Add margins on both sides
                }, freeRectangles);
            } else {
                // If we can't place it, put it at the bottom
                frame.posX = margin;
                frame.posY = binHeight;
                frame.usedWidth = frame.origWidth;
                frame.usedHeight = frame.origHeight;
                frame.rotated = false;

                // Update max right edge
                maxRightEdge = Math.max(maxRightEdge, frame.posX + frame.origWidth + margin);

                binHeight += frame.origHeight + margin;

                // Create new free rectangles on the sides of this one (include margin in used space)
                if (frame.origWidth + 2*margin < binWidth - 2*margin) {
                    freeRectangles.push({
                        x: margin + frame.origWidth + margin, // Add margin spacing
                        y: frame.posY - margin, // Back up for margin space
                        width: binWidth - 2*margin - (frame.origWidth + margin),
                        height: frame.origHeight + 2*margin
                    });
                }
            }
        });

        // Calculate actual needed width (at least the margin + maxRightEdge)
        const actualNeededWidth = Math.min(binWidth, maxRightEdge);

        return {
            usedWidth: actualNeededWidth,
            usedHeight: binHeight,
            layoutFrames: layoutFrames
        };
    }

    // Function to find the best placement for a frame
    function findBestPlacement(frame, freeRectangles, allowRotation, margin) {
        let bestScore = -Infinity;
        let bestRect = null;
        let bestRotated = false;

        // Heuristic methods for selecting placement
        const bestFitMethod = "best-short-side-fit"; // Options: "best-area-fit", "best-short-side-fit", "best-long-side-fit"

        // Try each free rectangle
        for (const rect of freeRectangles) {
            // Try normal orientation
            if (frame.origWidth <= rect.width && frame.origHeight <= rect.height) {
                const score = scoreRectangle(rect.width, rect.height, frame.origWidth, frame.origHeight, bestFitMethod);
                if (score > bestScore) {
                    bestScore = score;
                    bestRect = rect;
                    bestRotated = false;
                }
            }

            // Try rotated orientation if allowed
            if (allowRotation && frame.origHeight <= rect.width && frame.origWidth <= rect.height) {
                const score = scoreRectangle(rect.width, rect.height, frame.origHeight, frame.origWidth, bestFitMethod);
                if (score > bestScore) {
                    bestScore = score;
                    bestRect = rect;
                    bestRotated = true;
                }
            }
        }

        if (bestRect) {
            // Width and height that will actually be used
            const width = bestRotated ? frame.origHeight : frame.origWidth;
            const height = bestRotated ? frame.origWidth : frame.origHeight;

            return {
                x: bestRect.x,
                y: bestRect.y,
                width: width,
                height: height,
                rotated: bestRotated
            };
        }

        return null;
    }

    // Score a potential placement
    function scoreRectangle(rectWidth, rectHeight, frameWidth, frameHeight, method) {
        const areaFit = rectWidth * rectHeight - frameWidth * frameHeight;

        switch (method) {
            case "best-area-fit":
                return -areaFit; // Smaller leftover area is better
            case "best-short-side-fit":
                return -Math.min(rectWidth - frameWidth, rectHeight - frameHeight);
            case "best-long-side-fit":
                return -Math.max(rectWidth - frameWidth, rectHeight - frameHeight);
            default:
                return -areaFit;
        }
    }

    // Update free rectangles after placing a rectangle
    function placeRectangle(placement, freeRectangles) {
        // Split free rectangles that overlap with the placement
        const newFreeRectangles = [];

        for (let i = 0; i < freeRectangles.length; i++) {
            const free = freeRectangles[i];

            // If no overlap, keep the rectangle as is
            if (placement.x + placement.width <= free.x ||
                placement.x >= free.x + free.width ||
                placement.y + placement.height <= free.y ||
                placement.y >= free.y + free.height) {
                newFreeRectangles.push(free);
                continue;
            }

            // We have overlap - split the free rectangle into up to 4 new ones

            // Left of placement
            if (placement.x > free.x) {
                newFreeRectangles.push({
                    x: free.x,
                    y: free.y,
                    width: placement.x - free.x,
                    height: free.height
                });
            }

            // Right of placement
            if (free.x + free.width > placement.x + placement.width) {
                newFreeRectangles.push({
                    x: placement.x + placement.width,
                    y: free.y,
                    width: free.x + free.width - (placement.x + placement.width),
                    height: free.height
                });
            }

            // Above placement
            if (placement.y > free.y) {
                newFreeRectangles.push({
                    x: free.x,
                    y: free.y,
                    width: free.width,
                    height: placement.y - free.y
                });
            }

            // Below placement
            if (free.y + free.height > placement.y + placement.height) {
                newFreeRectangles.push({
                    x: free.x,
                    y: placement.y + placement.height,
                    width: free.width,
                    height: free.y + free.height - (placement.y + placement.height)
                });
            }
        }

        // Replace the old free rectangles with the new ones
        freeRectangles.length = 0;

        // Filter out contained rectangles
        for (const rect of newFreeRectangles) {
            if (!isRectangleContained(rect, newFreeRectangles)) {
                freeRectangles.push(rect);
            }
        }

        // Merge overlapping free rectangles to reduce their number
        mergeFreeRectangles(freeRectangles);
    }

    // Check if a rectangle is contained within any other rectangle
    function isRectangleContained(rect, rectangles) {
        for (const other of rectangles) {
            if (other !== rect &&
                rect.x >= other.x &&
                rect.y >= other.y &&
                rect.x + rect.width <= other.x + other.width &&
                rect.y + rect.height <= other.y + other.height) {
                return true;
            }
        }
        return false;
    }

    // Merge overlapping free rectangles to reduce fragmentation
    function mergeFreeRectangles(freeRectangles) {
        // Sort rectangles by area in descending order
        freeRectangles.sort((a, b) => (b.width * b.height) - (a.width * a.height));

        // This is a simplified merge that removes redundant rectangles
        for (let i = 0; i < freeRectangles.length; i++) {
            const rect = freeRectangles[i];
            for (let j = i + 1; j < freeRectangles.length; j++) {
                const other = freeRectangles[j];

                // Check if other is fully contained in rect
                if (other.x >= rect.x &&
                    other.y >= rect.y &&
                    other.x + other.width <= rect.x + rect.width &&
                    other.y + other.height <= rect.y + rect.height) {
                    freeRectangles.splice(j, 1);
                    j--;
                }
            }
        }
    }

    // Get paper dimensions in px
    const paperWpx = parseFloat(document.getElementById("paperWidth").value) * conversionFactors[currentUnit];
    const paperHpx = parseFloat(document.getElementById("paperHeight").value) * conversionFactors[currentUnit];

    // Try both orientations
    const normalResult = maximalRectanglesPacking(paperWpx);
    const normalArea = normalResult.usedWidth * normalResult.usedHeight;

    const swappedResult = maximalRectanglesPacking(paperHpx);
    const swappedArea = swappedResult.usedWidth * swappedResult.usedHeight;

    // Pick the better layout
    let finalLayout, finalWpx, finalHpx;
    if (swappedArea < normalArea) {
        finalLayout = swappedResult.layoutFrames;
        finalWpx = swappedResult.usedWidth;
        finalHpx = swappedResult.usedHeight;
    } else {
        finalLayout = normalResult.layoutFrames;
        finalWpx = normalResult.usedWidth;
        finalHpx = normalResult.usedHeight;
    }

    // Apply the best layout
    finalLayout.forEach((f, i) => {
        const element = frames[i].element;

        if (f.rotated) {
            // For rotated elements, we need to adjust the position and dimensions
            // to compensate for how CSS transforms work

            // When rotating 90 degrees, we need to:
            // 1. Set width and height to the swapped dimensions
            // 2. Use "transform-origin: top left" to rotate around top-left corner
            // 3. Adjust positioning to account for the rotation

            element.style.width = f.usedHeight + "px"; // Note: we swap width/height
            element.style.height = f.usedWidth + "px";
            element.style.left = f.posX + "px";
            element.style.top = f.posY + "px";
            element.style.transformOrigin = "top left";
            element.style.transform = "rotate(90deg) translate(0, -100%)";

            // Update table row if it exists
            const row = document.getElementById(element.id + "-row");
            if (row) {
                row.cells[1].textContent = (f.usedHeight / conversionFactors[currentUnit]).toFixed(2);
                row.cells[2].textContent = (f.usedWidth / conversionFactors[currentUnit]).toFixed(2);
                row.cells[4].querySelector(".rotate-value").textContent = "90°";
                row.cells[4].querySelector(".rotate-slider").value = 90;
            }
        } else {
            // For non-rotated elements, positioning is straightforward
            element.style.width = f.usedWidth + "px";
            element.style.height = f.usedHeight + "px";
            element.style.left = f.posX + "px";
            element.style.top = f.posY + "px";
            element.style.transform = "rotate(0deg)";
            element.style.transformOrigin = "center"; // reset to default

            // Update table row if it exists
            const row = document.getElementById(element.id + "-row");
            if (row) {
                row.cells[4].querySelector(".rotate-value").textContent = "0°";
                row.cells[4].querySelector(".rotate-slider").value = 0;
            }
        }
    });

    // Set final paper dimensions
    paper.style.width = finalWpx + "px";
    paper.style.height = finalHpx + "px";

    // Display final size in current unit
    const displayedW = finalWpx / conversionFactors[currentUnit];
    const displayedH = finalHpx / conversionFactors[currentUnit];
    const paperSizeOutput = document.getElementById("paperSizeOutput");
    paperSizeOutput.textContent = `Paper Size: ${displayedW.toFixed(2)} ${currentUnit} x ${displayedH.toFixed(2)} ${currentUnit}`;
    updateAllFrameSizeDisplays();setTimeout(generateAlignmentLines, 100);
}

document.addEventListener('DOMContentLoaded', function() {
    // For all input[type="number"] elements
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        // Set min attribute to 0 to prevent negative values
        input.setAttribute('min', '0');

        // Add event handler for direct entry validation
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = 0;
            }
        });

        // Prevent minus key
        input.addEventListener('keydown', function(e) {
            if (e.key === '-' || e.key === 'e') {
                e.preventDefault();
            }
        });
    });
});

// Global variable to track if size display is enabled
let showFrameSizes = true;

// Function to create or update the size display for a frame
function updateFrameSizeDisplay(frame) {
    // Get the frame's dimensions in the current unit
    const widthPx = parseFloat(frame.style.width);
    const heightPx = parseFloat(frame.style.height);
    const widthInUnit = (widthPx / conversionFactors[currentUnit]).toFixed(2);
    const heightInUnit = (heightPx / conversionFactors[currentUnit]).toFixed(2);

    // Check if the frame already has a size display
    let sizeDisplay = frame.querySelector('.frame-size-display');

    // If no display exists and showing is enabled, create one
    if (!sizeDisplay && showFrameSizes) {
        sizeDisplay = document.createElement('div');
        sizeDisplay.className = 'frame-size-display';
        frame.appendChild(sizeDisplay);
    }

    // If sizeDisplay exists, update its content
    if (sizeDisplay) {
        sizeDisplay.textContent = `${widthInUnit} × ${heightInUnit} ${currentUnit}`;
        sizeDisplay.style.display = showFrameSizes ? 'block' : 'none';

        // Adjust position if frame is rotated
        let transform = frame.style.transform;
        if (transform.includes('rotate(90deg)')) {
            sizeDisplay.style.transform = 'rotate(-90deg)';
            sizeDisplay.style.transformOrigin = 'left top';
            sizeDisplay.style.top = '50%';
            sizeDisplay.style.left = '10px';
        } else {
            sizeDisplay.style.transform = '';
            sizeDisplay.style.top = '5px';
            sizeDisplay.style.left = '5px';
        }
    }
}

// Function to update all frame size displays
function updateAllFrameSizeDisplays() {
    const frames = document.querySelectorAll('.frame');
    frames.forEach(frame => updateFrameSizeDisplay(frame));
}

// Toggle visibility of all frame size displays
function toggleFrameSizes() {
    showFrameSizes = !showFrameSizes;
    updateAllFrameSizeDisplays();
}

// Global variable to track if alignment lines are visible
showAlignmentLines = true;

// Function to clear all existing alignment lines
function clearAlignmentLines() {
    document.querySelectorAll('.alignment-line').forEach(line => line.remove());
}

// Function to create an alignment line
function createAlignmentLine(start, end, orientation) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', start.x);
    line.setAttribute('y1', start.y);
    line.setAttribute('x2', end.x);
    line.setAttribute('y2', end.y);
    line.setAttribute('stroke', '#666');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '3,3');
    line.classList.add('alignment-line');

    let svg = document.getElementById('guidelinesSvg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'guidelinesSvg';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '10';
        paper.appendChild(svg);
    }

    svg.appendChild(line);
}

// Main function to generate alignment lines
// Modified function to generate alignment lines
function generateAlignmentLines() {
    if (!showAlignmentLines) return;

    // Clear existing lines
    clearAlignmentLines();

    const frames = Array.from(document.querySelectorAll('.frame'));
    if (frames.length < 2) return; // Need at least 2 frames

    // Extract frame positions and dimensions
    const frameRects = frames.map(frame => {
        const rect = frame.getBoundingClientRect();
        const paperRect = paper.getBoundingClientRect();

        // Convert to coordinates relative to the paper container
        return {
            left: rect.left - paperRect.left,
            right: rect.right - paperRect.left,
            top: rect.top - paperRect.top,
            bottom: rect.bottom - paperRect.top,
            width: rect.width,
            height: rect.height,
            element: frame
        };
    });

    // Identify all unique horizontal and vertical positions
    const xPositions = new Set();
    const yPositions = new Set();

    frameRects.forEach(rect => {
        // Add positions with a small offset to create lines between frames
        xPositions.add(rect.left);
        xPositions.add(rect.right);
        yPositions.add(rect.top);
        yPositions.add(rect.bottom);
    });

    // Sort positions
    const sortedX = Array.from(xPositions).sort((a, b) => a - b);
    const sortedY = Array.from(yPositions).sort((a, b) => a - b);

    // Generate horizontal lines between frames
    for (let i = 0; i < sortedY.length; i++) {
        const y = sortedY[i];

        // Skip if this is a position that intersects a frame
        let isValidLine = true;
        for (const rect of frameRects) {
            // Check if this y position intersects with a frame
            if (y > rect.top && y < rect.bottom) {
                isValidLine = false;
                break;
            }
        }

        if (isValidLine) {
            // Create a horizontal line across the entire paper
            createAlignmentLine(
                { x: 0, y: y },
                { x: parseInt(paper.style.width) || paper.clientWidth, y: y },
                'horizontal'
            );
        }
    }

    // Generate vertical lines between frames
    for (let i = 0; i < sortedX.length; i++) {
        const x = sortedX[i];

        // Skip if this is a position that intersects a frame
        let isValidLine = true;
        for (const rect of frameRects) {
            // Check if this x position intersects with a frame
            if (x > rect.left && x < rect.right) {
                isValidLine = false;
                break;
            }
        }

        if (isValidLine) {
            // Create a vertical line across the entire paper
            createAlignmentLine(
                { x: x, y: 0 },
                { x: x, y: parseInt(paper.style.height) || paper.clientHeight },
                'vertical'
            );
        }
    }
}

function generateCuttingGuidelines() {
    // Remove any existing cutting guidelines
    document.querySelectorAll('.cutting-guide').forEach(line => line.remove());

    // Get all frames
    const frames = Array.from(document.querySelectorAll('.frame'));
    const paperRect = paper.getBoundingClientRect();
    const marginSize = parseFloat(document.getElementById('marginInput').value);
    const halfMargin = marginSize / 2;

    const frameRects = frames.map(frame => {
        const rect = frame.getBoundingClientRect();
        return {
            left: rect.left - paperRect.left,
            right: rect.right - paperRect.left,
            top: rect.top - paperRect.top,
            bottom: rect.bottom - paperRect.top,
            width: rect.width,
            height: rect.height,
            element: frame
        };
    });

    // For each frame, create cutting lines at half margin distance
    frameRects.forEach(rect => {
        // Calculate the positions for the cutting lines (half margin away from frame)
        createCuttingGuideline(
            { x: rect.left - halfMargin, y: rect.top - halfMargin },
            { x: rect.right + halfMargin, y: rect.top - halfMargin }
        ); // Top

        createCuttingGuideline(
            { x: rect.right + halfMargin, y: rect.top - halfMargin },
            { x: rect.right + halfMargin, y: rect.bottom + halfMargin }
        ); // Right

        createCuttingGuideline(
            { x: rect.left - halfMargin, y: rect.bottom + halfMargin },
            { x: rect.right + halfMargin, y: rect.bottom + halfMargin }
        ); // Bottom

        createCuttingGuideline(
            { x: rect.left - halfMargin, y: rect.top - halfMargin },
            { x: rect.left - halfMargin, y: rect.bottom + halfMargin }
        ); // Left
    });
}

function createCuttingGuideline(start, end) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', start.x);
    line.setAttribute('y1', start.y);
    line.setAttribute('x2', end.x);
    line.setAttribute('y2', end.y);
    line.setAttribute('stroke', 'red');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '3,3');
    line.classList.add('cutting-guide');

    let svg = document.getElementById('guidelinesSvg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'guidelinesSvg';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '10';
        paper.appendChild(svg);
    }

    svg.appendChild(line);
}

// Function to generate horizontal alignment lines
function generateHorizontalLines(frameRects) {
    // Get all unique top and bottom positions
    const horizontalEdges = [];
    frameRects.forEach(rect => {
        horizontalEdges.push({
            position: rect.top,
            isTop: true,
            rect: rect
        });
        horizontalEdges.push({
            position: rect.bottom,
            isTop: false,
            rect: rect
        });
    });

    // Sort by position
    horizontalEdges.sort((a, b) => a.position - b.position);

    // Find gaps between frames where we can draw lines
    for (let i = 0; i < horizontalEdges.length - 1; i++) {
        const currentEdge = horizontalEdges[i];
        const nextEdge = horizontalEdges[i + 1];

        // Skip if edges are too close
        if (nextEdge.position - currentEdge.position < 10) continue;

        // Calculate potential line position (middle of gap)
        const lineY = (currentEdge.position + nextEdge.position) / 2;

        // Make sure this line doesn't intersect any frame
        if (isSpaceClear(frameRects, null, lineY, 'horizontal')) {
            // Find frames to the left and right of this space to determine line length
            const leftMostX = 0;
            const rightMostX = parseInt(paper.style.width) || paper.clientWidth;

            // Create the line
            createAlignmentLine(
                { x: leftMostX, y: lineY },
                { x: rightMostX, y: lineY },
                'horizontal'
            );
        }
    }
}

// Function to generate vertical alignment lines
function generateVerticalLines(frameRects) {
    // Get all unique left and right positions
    const verticalEdges = [];
    frameRects.forEach(rect => {
        verticalEdges.push({
            position: rect.left,
            isLeft: true,
            rect: rect
        });
        verticalEdges.push({
            position: rect.right,
            isLeft: false,
            rect: rect
        });
    });

    // Sort by position
    verticalEdges.sort((a, b) => a.position - b.position);

    // Find gaps between frames where we can draw lines
    for (let i = 0; i < verticalEdges.length - 1; i++) {
        const currentEdge = verticalEdges[i];
        const nextEdge = verticalEdges[i + 1];

        // Skip if edges are too close
        if (nextEdge.position - currentEdge.position < 10) continue;

        // Calculate potential line position (middle of gap)
        const lineX = (currentEdge.position + nextEdge.position) / 2;

        // Make sure this line doesn't intersect any frame
        if (isSpaceClear(frameRects, lineX, null, 'vertical')) {
            // Find frames above and below this space to determine line length
            const topMostY = 0;
            const bottomMostY = parseInt(paper.style.height) || paper.clientHeight;

            // Create the line
            createAlignmentLine(
                { x: lineX, y: topMostY },
                { x: lineX, y: bottomMostY },
                'vertical'
            );
        }
    }
}

// Check if a potential line position would intersect with any frames
function isSpaceClear(frameRects, x, y, type) {
    for (const rect of frameRects) {
        if (type === 'horizontal') {
            // For horizontal lines, check if the line's y-position intersects with any frame
            if (y > rect.top && y < rect.bottom) {
                return false;
            }
        } else if (type === 'vertical') {
            // For vertical lines, check if the line's x-position intersects with any frame
            if (x > rect.left && x < rect.right) {
                return false;
            }
        }
    }
    return true;
}

// Toggle visibility of alignment lines
function toggleAlignmentLines() {
    showAlignmentLines = !showAlignmentLines;

    if (showAlignmentLines) {
        generateAlignmentLines();
    } else {
        clearAlignmentLines();
    }
}
// Add event listener for the alignment lines toggle button
document.getElementById('toggleAlignmentLines').addEventListener('click', function() {
    showAlignmentLines = !showAlignmentLines;
    if (showAlignmentLines) {
        generateAlignmentLines();
        generateCuttingGuidelines();
    } else {
        clearAlignmentLines();
        document.querySelectorAll('.cutting-guide').forEach(line => line.remove());
    }
});


function makeDraggable(element) {
    let initialX, initialY;
    element.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("mousemove", drag);

    function dragStart(e) {
        initialX = e.clientX - parseInt(element.style.left || '0', 10);
        initialY = e.clientY - parseInt(element.style.top || '0', 10);
        element.classList.add("dragging");
        element.style.zIndex = 1000;
        e.stopPropagation(); // Prevent other handlers from firing
    }

    function drag(e) {
        if (element.classList.contains("dragging")) {
            let newX = e.clientX - initialX;
            let newY = e.clientY - initialY;

            // Instead of restricting to parent boundaries, allow movement and resize paper
            const isRotated = element.style.transform.includes('rotate(90deg)');

            // Get the correct dimensions based on rotation state
            let frameWidth, frameHeight;
            if (isRotated) {
                frameWidth = element.offsetHeight;
                frameHeight = element.offsetWidth;
            } else {
                frameWidth = element.offsetWidth;
                frameHeight = element.offsetHeight;
            }

            // Only prevent negative positioning (below zero)
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);

            // Update frame position
            element.style.left = newX + "px";
            element.style.top = newY + "px";

            // Resize paper if needed
            const rightEdge = newX + frameWidth;
            const bottomEdge = newY + frameHeight;

            const currentPaperWidth = paper.clientWidth;
            const currentPaperHeight = paper.clientHeight;

            // Check if we need to resize the paper
            if (rightEdge > currentPaperWidth || bottomEdge > currentPaperHeight) {
                // Resize paper to fit the frame with some padding
                const newWidth = Math.max(currentPaperWidth, rightEdge + 20);
                const newHeight = Math.max(currentPaperHeight, bottomEdge + 20);

                paper.style.width = newWidth + "px";
                paper.style.height = newHeight + "px";

                // If you have UI elements showing paper dimensions, update them here
                // updatePaperSizeDisplay(newWidth, newHeight);
            }

            // Optionally check if we can shrink the paper
            optimizePaperSize();
        }
        updatePaperSizeDisplay();
    }

    function dragEnd() {
        element.classList.remove("dragging");
        element.style.zIndex = "";
        updateFrameSizeDisplay(element);

        // Final paper size optimization
        optimizePaperSize();

        setTimeout(generateAlignmentLines, 100);
        updatePaperSizeDisplay();
    }

    // Function to find optimal paper size based on all frames
    function optimizePaperSize() {
        // Find the rightmost and bottommost points of all frames
        let maxRight = 0;
        let maxBottom = 0;

        const frames = document.querySelectorAll('.frame');
        frames.forEach(frame => {
            const isFrameRotated = frame.style.transform.includes('rotate(90deg)');

            const frameWidth = isFrameRotated ? frame.offsetHeight : frame.offsetWidth;
            const frameHeight = isFrameRotated ? frame.offsetWidth : frame.offsetHeight;

            const frameLeft = parseInt(frame.style.left || '0', 10);
            const frameTop = parseInt(frame.style.top || '0', 10);

            const frameRight = frameLeft + frameWidth;
            const frameBottom = frameTop + frameHeight;

            maxRight = Math.max(maxRight, frameRight);
            maxBottom = Math.max(maxBottom, frameBottom);
        });

        // Add padding
        maxRight += 20;
        maxBottom += 20;

        // Set minimum dimensions
        const minWidth = 100;
        const minHeight = 100;

        const newWidth = Math.max(minWidth, maxRight);
        const newHeight = Math.max(minHeight, maxBottom);

        // Update paper size
        paper.style.width = newWidth + "px";
        paper.style.height = newHeight + "px";
    }
    function updatePaperSizeDisplay() {
        const currentUnit = document.getElementById("paperUnit").value;
        const factor = conversionFactors[currentUnit];

        // Get current paper dimensions in pixels
        const paperWidthPx = paper.clientWidth;
        const paperHeightPx = paper.clientHeight;

        // Convert to current unit
        const displayedW = paperWidthPx / factor;
        const displayedH = paperHeightPx / factor;

        // Update your existing element
        const paperSizeOutput = document.getElementById("paperSizeOutput");
        paperSizeOutput.textContent = `Paper Size: ${displayedW.toFixed(2)} ${currentUnit} x ${displayedH.toFixed(2)} ${currentUnit}`;
    }

}


// Update alignment lines on window resize
window.addEventListener('resize', function() {
    if (showAlignmentLines) {
        clearAlignmentLines();
        setTimeout(generateAlignmentLines, 100);
    }
});
// Generate alignment lines on initial load if there are frames
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(generateAlignmentLines, 500); // Longer timeout for initial load
});

// Add event listener for the toggle button
document.getElementById('toggleFrameSizes').addEventListener('click', toggleFrameSizes);

// Add this after setting up the slider event listener
const rotationButtons = row.querySelectorAll(".rotate-btn");
rotationButtons.forEach(btn => {
    btn.addEventListener("click", function() {
        const angle = parseInt(this.getAttribute("data-angle"));
        const frameId = this.getAttribute("data-frame-id");
        const frame = document.getElementById(frameId);

        // Update the frame rotation
        frame.style.transform = `rotate(${angle}deg)`;

        // Update the slider and display value to match
        const slider = row.querySelector(".rotate-slider");
        const rotateValue = row.querySelector(".rotate-value");
        slider.value = angle;
        rotateValue.textContent = `${angle}°`;

        // If showing alignment lines, regenerate them
        if (showAlignmentLines) {
            setTimeout(generateAlignmentLines, 100);
        }
    });
});
