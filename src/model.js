import Stream from 'mithril-stream'
import confetti from 'canvas-confetti'

const newModel = () => ({
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
    chunks.push(chunkCanvas.toDataURL());
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
  isUser && console.log(calcStepsLeft(mdl), mdl.swap.history)
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

// function saveImageToDesktop(mdl, imageSrc) {
//   const squareRects = mdl.blocks.map(b => b.coords)
//   // Create an empty canvas with the same dimensions as the grid
//   // const width = squareRects[0].width * 5;
//   // const height = squareRects[0].height * 5;
//   const canvas = document.createElement('canvas');
//   canvas.width = 420;
//   canvas.height = 420;
//   const ctx = canvas.getContext('2d');

//   // Load the image from the src
//   const image = new Image();
//   image.src = imageSrc;
//   image.onload = () => {
//     // console.log('load')
//     // Iterate through the squareRects array and draw the correct section of the image onto the canvas
//     squareRects.map(squareRect => {
//       const x = squareRect.x - squareRect.width / 4;
//       const y = squareRect.y - squareRect.height / 4;

//       // Draw the correct section of the image onto the canvas
//       ctx.drawImage(image, x, y, squareRect.width, squareRect.height, x, y, squareRect.width, squareRect.height);
//     });

//     // Create a link that allows the user to download the image
//     const dataUrl = canvas.toDataURL();

//     mdl.img.srcs(dataUrl)
//     document.body.appendChild(canvas)
//     const link = document.createElement('a');
//     link.download = 'image.png';
//     link.href = dataUrl;
//     link.click();
//   };
// }


const calculateMovesLeft = mdl => {
  if (mdl.swap.history.slice(-2)[0] == mdl.state.hiddenBlock()) {
    return mdl.state.levels[mdl.state.level()].count - calculateMovesTaken(mdl)
  } else {
    return mdl.state.levels[mdl.state.level()].count + calculateMovesTaken(mdl)
  }
}

export { newModel, upload, newGame, splitImage, isSwapBlock, isHiddenBlock, isDraggable, moveBlock, setBackground, selectHiddenBlockAndShuffle, selectLevel, calculateMovesTaken, isHistoryBlock, restart, calcStepsLeft, calculateMovesLeft, isLastHistoryBlock }
