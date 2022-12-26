import Stream from 'mithril-stream'
import confetti from 'canvas-confetti'

const newModel = () => ({
  chunks: [],
  blocks: [],
  originals: [],
  swap: {
    isDragging: false,
    swapBlockIds: [],
    history: [],
    path: [],
  },
  state: {
    showHint: Stream(false),
    userMoves: Stream(0),
    status: Stream('select'),
    hiddenBlock: Stream(null),
    direction: Stream('horizontal'),
    size: Stream(0),
    levels: {
      Easy: { count: 25, subtract: 19 },
      Medium: { count: 50, subtract: 99 },
      Hard: { count: 100, subtract: 199 }
    },
    level: Stream(null)
  },
  img: {
    src: Stream(null),
    srcs: Stream(null),
    width: Stream(0),
    height: Stream(0),
    zIndex: Stream(0),
    display: Stream(true)
  }
})


const getRandom = xs => xs[Math.floor(Math.random() * xs.length)]

const newGame = mdl => {
  mdl.blocks = []
  mdl.img.src(null)
  mdl.img.width(0)
  mdl.img.height(0)
  mdl.img.zIndex(0)
  mdl.img.display(true)

  mdl.state.hiddenBlock(null)
  mdl.state.direction('horizontal')
  mdl.state.showHint(false)
  mdl.state.level(null)

  mdl.swap.isDragging = false
  mdl.swap.src = { coords: null, idx: null, id: null, dom: null, img: null }
  mdl.swap.target = { coords: null, idx: null, id: null, dom: null, img: null }
  mdl.swap.swapBlockIds = []
  mdl.swap.history = []
  mdl.swap.path = []

  return mdl
}

window.log = m => v => {
  console.log(m, v)
  return v
}

const DISTANCE_BETWEEN_CELLS = [100, 101]

const distanceBetweenElements = (el1, el2) => {
  const x1 = el1.offsetTop;
  const y1 = el1.offsetLeft;
  const x2 = el2.offsetTop;
  const y2 = el2.offsetLeft;
  const xDistance = x1 - x2;
  const yDistance = y1 - y2;
  return Math.sqrt((xDistance * xDistance) + (yDistance * yDistance));
}

const uuid = () =>
  'xxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });


export const toBlocks = (img, idx) =>
  ({ img, idx, id: uuid(), coords: {} })


const getNeighbourIds = (id, target) => {
  const divs = Array.from(target.parentNode.children)
  const hiddenDiv = divs.find(b => b.id == id)
  hiddenDiv.style.backgroundImage = ''
  const isNeighbour = div => DISTANCE_BETWEEN_CELLS.includes(distanceBetweenElements(hiddenDiv, div))

  return divs.filter(isNeighbour).map(el => el.id)
}

const splitImage = (mdl, image) => {
  const width = image.width;
  const height = image.height;
  const chunkWidth = Math.ceil(width / 16);
  const chunks = []
  for (let x = 0; x < width; x += chunkWidth) {
    const chunkCanvas = document.createElement('canvas');
    const chunkContext = chunkCanvas.getContext('2d');
    chunkCanvas.width = chunkWidth;
    chunkCanvas.height = height;
    chunkContext.drawImage(image, x, 0, chunkWidth, height, 0, 0, chunkWidth, height);
    chunkContext.clip()
    chunks.push(chunkCanvas.toDataURL());
    mdl.chunks.push(chunkCanvas)
  }
  const blocks = chunks.map(toBlocks)
  mdl.blocks = structuredClone(blocks)
  mdl.img.display(false)
}

const selectLevel = (mdl, level) => {
  mdl.state.level(level)
  mdl.state.status('select square')
}

const upload = mdl => ({ target: { files } }) => {
  mdl.file = files[0]
  return Promise.resolve(mdl.img.src(URL.createObjectURL(mdl.file)))
}

const restart = mdl => {
  mdl.swap.history = []
  mdl.swap.path = []
  mdl.swap.swapBlockIds = []
  mdl.swap.history = []
  mdl.state.hiddenBlock(null)
  mdl.state.direction('horizontal')
  mdl.state.level(null)
  mdl.state.showHint(false)
  mdl.blocks = []
  mdl.originals = []
  mdl.img.display(true)

  upload(mdl)({ target: { files: [mdl.file] } }).then(() => mdl.state.status('select level'))
}


const calcStepsLeft = mdl => {
  const original = JSON.parse(mdl.originals).map((b) => JSON.stringify(b.coords))
  const current = mdl.blocks.map((b) => JSON.stringify(b.coords))
  return original.map((original, idx) => original == current[idx]).reduce((total, next) =>
    next ? total : total + 1, 0)
}



const selectHiddenBlock = (mdl, id, isUser) => ({ target }) => {
  if (isUser && mdl.swap.history.slice(-2)[0] == id) {
    mdl.swap.history.pop()
  } else {
    mdl.swap.history.push(id)
  }

  isUser && mdl.state.userMoves(mdl.state.userMoves() + 1)

  mdl.state.hiddenBlock(id)
  mdl.swap.swapBlockIds = getNeighbourIds(id, target)
  if (mdl.state.status() == 'ready' &&
    calcStepsLeft(mdl) == 0) {
    mdl.state.status('completed')
    mdl.img.display(true)
    fireworks()
  }
  return mdl
}

const isSwapBlock = (mdl, block) => mdl.swap.swapBlockIds.includes(block.id)
const isHiddenBlock = (mdl, block) => block.id == mdl.state.hiddenBlock()
const isHistoryBlock = (mdl, block) => {
  return mdl.swap.history.includes(block.id)
}
const isLastHistoryBlock = (mdl, block) =>
  mdl.swap.history.slice(-2)[0] == block.id

const isDraggable = (mdl, block) => {
  if (mdl.swap.isDragging) {
    return isHiddenBlock(mdl, block)
  } else {
    return isSwapBlock(mdl, block) || isHiddenBlock(mdl, block)
  }
}
const moveBlock = (mdl, block, isUser) => {
  if (!mdl.swap.swapBlockIds.includes(block.id)) return
  const id = mdl.state.hiddenBlock()
  const target = mdl.blocks.find(b => b.id == id)
  const targetDom = target.dom
  const tempCoords = target.coords
  target.coords = block.coords
  setBackground(mdl, block, targetDom)
  mdl.swap.dragging = false
  block.coords = tempCoords
  selectHiddenBlock(mdl, block.id, isUser)({ target: block.dom })
}

const setBackground = (mdl, block, dom) => {
  dom.style.backgroundImage = `url(${JSON.stringify(mdl.img.src())})`
  dom.style.backgroundSize = `${mdl.img.width()}px ${mdl.img.height()}px`
  dom.style.backgroundPosition = `${mdl.img.coords.left - block.coords.left}px ${mdl.img.coords.top - block.coords.top}px`
  dom.style.backgroundRepeat = 'no-repeat'
}


const selectHiddenBlockAndShuffle = (mdl, block, count) => ({ target }) => {
  if (count == mdl.state.levels[mdl.state.level()].count) {
    mdl.state.status('ready')
    mdl.swap.path = [...mdl.swap.history]
    return (mdl)
  } else if (count == 0) {
    selectHiddenBlock(mdl, block.id)({ target })
    return selectHiddenBlockAndShuffle(mdl, block, count + 1)({ target })
  } else if (count > 0) {
    const lastId = mdl.swap.history.slice(-2)[0]
    let filtered = mdl.swap.swapBlockIds.filter(id => id !== lastId)
    const randomUuid = getRandom(filtered)
    if (randomUuid == undefined) {
      count = mdl.state.levels[mdl.state.level()].count
      return selectHiddenBlockAndShuffle(mdl, block, count)({ target: block.dom })
    }
    const nextBlock = mdl.blocks.find(b => b.id == randomUuid)
    const nextTarget = block.dom
    moveBlock(mdl, nextBlock)
    return selectHiddenBlockAndShuffle(mdl, nextBlock, count + 1)({ target: nextTarget })
  }
}

const fireworks = () => {
  const duration = 15 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}

const calculateMovesTaken = mdl => {

  return mdl.swap.history.length - mdl.state.levels[mdl.state.level()].count
}

// function saveImageToDesktop(mdl) {
//   const canvasList = mdl.chunks
//   const getBoundingClientRectList = mdl.blocks.map(b => b.coords)
//   console.log(getBoundingClientRectList, canvasList)
//   const newCanvas = document.createElement('canvas');
//   const img = new Image()
//   img.src = mdl.img.src()
//   newCanvas.width = img.width
//   newCanvas.height = img.height

//   // Get the new canvas' 2D context
//   const ctx = newCanvas.getContext('2d');

//   // Iterate through the list of canvases and getBoundingClientRect objects
//   for (let i = 0; i < canvasList.length; i++) {
//     const canvas = canvasList[i];
//     const rect = getBoundingClientRectList[i];

//     // Draw the canvas on the new canvas
//     ctx.drawImage(canvas, rect.left, rect.top, rect.width, rect.height);
//   }


//   // Retrieve the composite image as a data URL
//   const compositeImage = newCanvas.toDataURL();

//   // Create a link element
//   const link = document.createElement('a');

//   // Set the link's href to the composite image data URL
//   link.href = compositeImage;

//   // Set the download attribute to specify the desired file name
//   link.download = 'composite-image.png';

//   // Append the link to the body of the document
//   document.body.appendChild(link);

//   // Click the link to trigger the download
//   link.click();

//   // Remove the link from the document
//   document.body.removeChild(link);
// }
// function saveImageToDesktop(mdl) {
//   const canvasList = mdl.chunks
//   const imgs = mdl.chunks.map(c => c.toDataURL())
//   const getBoundingClientRectList = mdl.blocks.map(b => b.coords)
//   console.log(getBoundingClientRectList, canvasList, imgs)
//   // const newCanvas = document.createElement('canvas');
//   const img = new Image()
//   img.src = mdl.img.src()
//   const targetWidth = 400
//   const targetHeight = 400
//   // Create an image element
//   const image = new Image();

//   // Set the image's src to the data source
//   image.src = mdl.img.src();

//   // Create a canvas element
//   const canvas = document.createElement('canvas');

//   // Set the canvas size to the desired target width and height
//   canvas.width = targetWidth;
//   canvas.height = targetHeight;

//   // Get the canvas' 2D context
//   const ctx = canvas.getContext('2d');

//   // Wait for the image to load
//   image.addEventListener('load', () => {
//     console.log('loaded')
//     // Draw the image on the canvas
//     ctx.drawImage(image, 0, 0);

//     // Iterate through the list of getBoundingClientRect objects
//     for (let i = 0; i < getBoundingClientRectList.length; i++) {
//       const rect = getBoundingClientRectList[i];

//       // Set the position and size of the image on the canvas
//       ctx.drawImage(image, rect.left, rect.top, rect.width, rect.height);
//       ctx.clip(new Path2D(rect))
//     }

//     // Retrieve the composite image as a data URL
//     const compositeImage = canvas.toDataURL();

//     // Create a link element
//     const link = document.createElement('a');

//     // Set the link's href to the composite image data URL
//     link.href = compositeImage;

//     // Set the download attribute to specify the desired file name
//     link.download = 'composite-image.png';

//     // Append the link to the body of the document
//     document.body.appendChild(link);

//     // Click the link to trigger the download
//     link.click();

//     // Remove the link from the document
//     document.body.removeChild(link);
//   });
// }


function saveImageToDesktop(mdl) {
  const imageDataSource = mdl.img.src()
  const targetWidth = 400
  const targetHeight = 400
  const getClientBoundingRectList = mdl.blocks.map(b => b.coords)
  // Create an image element
  const image = new Image();

  // Set the image's src to the data source
  image.src = imageDataSource;

  // Create a canvas element
  const canvas = document.createElement('canvas');

  // Set the canvas size to the desired target width and height
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Get the canvas' 2D context
  const ctx = canvas.getContext('2d');

  // Wait for the image to load
  image.addEventListener('load', () => {
    // Draw the entire image on the canvas
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    // Calculate the size of each chunk in the grid
    const chunkWidth = targetWidth / 4;
    const chunkHeight = targetHeight / 4;

    // Iterate through the list of getClientBoundingRect objects
    for (let i = 0; i < getClientBoundingRectList.length; i++) {
      const rect = getClientBoundingRectList[i];
      console.log(rect)
      // Set the position and size of the chunk on the canvas
      ctx.rect(rect.left, rect.top, chunkWidth, chunkHeight);
    }

    // Clip the image to the desired shapes

    // Retrieve the composite image as a data URL
    const compositeImage = canvas.toDataURL();

    // Create a link element
    const link = document.createElement('a');

    // Set the link's href to the composite image data URL
    link.href = compositeImage;

    // Set the download attribute to specify the desired file name
    link.download = 'composite-image.png';

    // Append the link to the body of the document
    document.body.appendChild(link);

    // Click the link to trigger the download
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);
  });
}


const calculateMovesLeft = mdl => {
  if (mdl.swap.history.slice(-2)[0] == mdl.state.hiddenBlock()) {
    return mdl.state.levels[mdl.state.level()].count - calculateMovesTaken(mdl)
  } else {
    return mdl.state.levels[mdl.state.level()].count + calculateMovesTaken(mdl)
  }
}

export { newModel, upload, newGame, splitImage, isSwapBlock, isHiddenBlock, isDraggable, moveBlock, setBackground, selectHiddenBlockAndShuffle, selectLevel, calculateMovesTaken, isHistoryBlock, restart, calcStepsLeft, calculateMovesLeft, isLastHistoryBlock, saveImageToDesktop }
