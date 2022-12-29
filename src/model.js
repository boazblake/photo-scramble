import Stream from 'mithril-stream'
import { getRandom, distanceBetweenElements, uuid, fireworks } from './utils.js'



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
    screenSize: Stream('PHONE'),
    showHint: Stream(false),
    hintUsed: Stream(0),
    userMoves: Stream(0),
    status: Stream('select image'),
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

const DISTANCE_BETWEEN_CELLS = [100, 101]


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
  mdl.state.hintUsed(0)
  mdl.state.level(null)
  mdl.state.userMoves(0)
  mdl.state.status('select image')

  mdl.swap.isDragging = false
  mdl.swap.src = { coords: null, idx: null, id: null, dom: null, img: null }
  mdl.swap.target = { coords: null, idx: null, id: null, dom: null, img: null }
  mdl.swap.swapBlockIds = []
  mdl.swap.history = []
  mdl.swap.path = []

  return mdl
}

const toBlocks = (img, idx) =>
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
  mdl.state.hintUsed(0)
  mdl.state.userMoves(0)
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
const isHistoryBlock = (mdl, block) => mdl.swap.history.includes(block.id)
const isLastHistoryBlock = (mdl, block) => mdl.swap.history.slice(-2)[0] == block.id

const isDraggable = (mdl, block) => {
  if (mdl.swap.isDragging) {
    return isHiddenBlock(mdl, block)
  } else {
    return isSwapBlock(mdl, block) || isHiddenBlock(mdl, block)
  }
}
const moveBlock = (mdl, block, isUser) => {
  if (!mdl.swap.swapBlockIds.includes(block.id)) return
  mdl.state.showHint() && mdl.state.hintUsed(mdl.state.hintUsed() + 1)
  let checkbox = document.getElementById('hint')
  if (checkbox) {
    checkbox.checked = false
    mdl.state.showHint(false)
  }
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

const calculateMovesTaken = mdl => mdl.swap.history.length - mdl.state.levels[mdl.state.level()].count


const calculateMovesLeft = mdl => {
  if (mdl.swap.history.slice(-2)[0] == mdl.state.hiddenBlock()) {
    return mdl.state.levels[mdl.state.level()].count - calculateMovesTaken(mdl)
  } else {
    return mdl.state.levels[mdl.state.level()].count + calculateMovesTaken(mdl)
  }
}

const getBorder = (mdl, block) =>
  mdl.state.status() == 'select square' || (isSwapBlock(mdl, block) && mdl.state.status() !== 'completed')
    ? isLastHistoryBlock(mdl, block) && mdl.state.showHint()
      ? '3px solid var(--hint)'
      : '3px solid var(--hilight)'
    : ''

const getBlockClass = (mdl, block) => isHiddenBlock(mdl, block)
  ? 'isSwapBlock'
  : isSwapBlock(mdl, block)
    ? 'point isSwapBlock'
    : mdl.state.status() == 'select square' && 'point'

const getAction = (mdl, block) => mdl.state.hiddenBlock()
  ? () => moveBlock(mdl, block, true)
  : mdl.state.level() && mdl.state.status() !== 'completed' && selectHiddenBlockAndShuffle(mdl, block, 0)


const getAppClass = mdl =>
  mdl.img.src() && mdl.state.screenSize() == 'TABLET' ? 'row' : 'col'

const getAppStyle = mdl => mdl.img.src() && mdl.state.screenSize() == 'TABLET' && { justifyContent: 'space-between' }

const getHeaderStyle = mdl => ({
  height: mdl.state.screenSize() == 'TABLET' && mdl.img.src() ? '80%' : '50%',
  justifyContent: mdl.state.screenSize() == 'TABLET' && mdl.img.src() ? 'space-evenly' : 'flex-end'

})

const getTitleStyle = mdl => ({
  left: mdl.state.screenSize() == 'TABLET' && mdl.img.src() ? 0 : 'inherit',
  fontSize: '3rem'//mdl.state.screenSize() == 'TABLET' && mdl.img.src() ? '3rem' : '2rem'
})

export { newModel, upload, newGame, splitImage, isSwapBlock, isHiddenBlock, isDraggable, moveBlock, setBackground, selectHiddenBlockAndShuffle, selectLevel, calculateMovesTaken, isHistoryBlock, restart, calcStepsLeft, calculateMovesLeft, isLastHistoryBlock, getBorder, getBlockClass, getAction, getAppClass, getAppStyle, getTitleStyle, getHeaderStyle }
