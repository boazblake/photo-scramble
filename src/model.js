import m from 'mithril'
import Stream from 'mithril-stream'
import { getRandom, distanceBetweenElements, uuid, fireworks, clamp } from './utils.js'

// const SCREEN_SIZES = ['PHONE', 'TABLET', 'DESKTOP']
// const STATUS = ['READY', 'COMPLETED', 'SELECT_IMG', 'SELECT_SQR', 'SELECT_LEVEL', 'SHUFFLING']

const newModel = () => ({
  chunks: [],
  blocks: [],
  originals: [],
  help:
  {
    toggles: [
      { isDisabled: mdl => mdl.state.showHint() || mdl.state.showOriginalImage(), id: 'showHint', label: 'Show Hint', action: mdl => mdl.state.showHint(!mdl.state.showHint()) },
      {
        isDisabled: (mdl) => mdl.state.showHiddenImage() && mdl.state.showHint(),
        id: 'originalimage',
        label: 'Show Original Image', action: mdl => {
          mdl.img.display(!mdl.img.display())
          mdl.state.showOriginalImage(!mdl.state.showOriginalImage())
        }
      },
      // { isDisabled: mdl => mdl.state.showOriginalImage(), id: 'hiddensquare', label: 'Toggle hidden square', action: mdl => mdl.state.showHiddenImage(!mdl.state.showHiddenImage()) }
    ]
  }
  ,
  swap: {
    isDragging: false,
    swapBlockIds: [],
    history: [],
    path: [],
  },
  state: {
    showHelp: Stream(false),
    screenSize: Stream('PHONE'),
    showOriginalImage: Stream(false),
    showHiddenImage: Stream(false),
    showHint: Stream(false),
    hintUsed: Stream(0),
    userMoves: Stream(0),
    status: Stream('SELECT_IMG'),
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
  mdl.state.showOriginalImage(false)
  mdl.state.showHiddenImage(false)
  mdl.state.showHelp(false)
  mdl.state.hintUsed(0)
  mdl.state.level(null)
  mdl.state.userMoves(0)
  mdl.state.status('SELECT_IMG')

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
  mdl.state.status('SELECT_SQR')
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
  mdl.state.showOriginalImage(false)
  mdl.state.showHiddenImage(false)
  mdl.state.showHelp(false)
  mdl.state.hintUsed(0)
  mdl.state.userMoves(0)
  mdl.blocks = []
  mdl.originals = []
  mdl.img.display(true)

  upload(mdl)({ target: { files: [mdl.file] } }).then(() => mdl.state.status('SELECT_LEVEL'))
}


const calcStepsLeft = mdl => {
  const original = JSON.parse(mdl.originals).map((b) => JSON.stringify(b.coords))
  const current = mdl.blocks.map((b) => JSON.stringify(b.coords))
  return original.map((original, idx) => original == current[idx])
    .reduce((total, next) =>
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
  if (mdl.state.status() == 'READY' &&
    calcStepsLeft(mdl) == 0) {
    mdl.state.status('COMPLETED')
    mdl.img.display(true)
    fireworks()
  }
  return mdl
}

const moveBlock = (mdl, block, isUser) => {
  if (!mdl.swap.swapBlockIds.includes(block.id)) return
  mdl.state.showHint() && mdl.state.hintUsed(mdl.state.hintUsed() + 1)
  let checkbox = document.getElementById('showHint')
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
  mdl.swap.isDragging = false
  block.coords = tempCoords
  selectHiddenBlock(mdl, block.id, isUser)({ target: block.dom })
}

const setBackground = (mdl, block, dom) => {
  dom.style.backgroundImage = `url(${JSON.stringify(mdl.img.src())})`
  dom.style.backgroundSize = `${mdl.img.width()}px ${mdl.img.height()}px`
  dom.style.backgroundPosition = `${mdl.img.coords.left - block.coords.left}px ${mdl.img.coords.top - block.coords.top}px`
  dom.style.backgroundRepeat = 'no-repeat'
}

const shuffleBoard = (mdl, block, count, target) =>
  setTimeout(() => {
    selectHiddenBlockAndShuffle(mdl, block, count)({ target })
    m.redraw()
  }, 30)


const selectHiddenBlockAndShuffle = (mdl, block, count) => ({ target }) => {
  if (count == mdl.state.levels[mdl.state.level()].count) {
    mdl.state.status('READY')
    mdl.swap.path = [...mdl.swap.history]
    return mdl
  } else if (count == 0) {
    mdl.state.status('SHUFFLING')
    selectHiddenBlock(mdl, block.id)({ target })
    return shuffleBoard(mdl, block, count + 1, target)
  } else if (count > 0) {
    const lastId = mdl.swap.history.slice(-2)[0]
    let filtered = mdl.swap.swapBlockIds.filter(id => id !== lastId)
    const randomUuid = getRandom(filtered)
    if (!randomUuid) {
      count = mdl.state.levels[mdl.state.level()].count
      shuffleBoard(mdl, block, count, block.dom)
    }
    const nextBlock = mdl.blocks.find(b => b.id == randomUuid)
    const nextTarget = block.dom
    moveBlock(mdl, nextBlock)
    return shuffleBoard(mdl, block, count + 1, nextTarget)
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

const blockBorder = (mdl, block) =>
  mdl.state.status() == 'SELECT_SQR' || (isSwapBlock(mdl, block) && mdl.state.status() !== 'COMPLETED')
    ? isLastHistoryBlock(mdl, block) && mdl.state.showHint()
      ? '3px solid var(--hint)'
      : '3px solid var(--hilight)'
    : ''

const blockClassList = (mdl, block) => isHiddenBlock(mdl, block)
  ? 'isSwapBlock'
  : isSwapBlock(mdl, block)
    ? 'point isSwapBlock'
    : mdl.state.status() == 'SELECT_SQR' ? 'point' : ''

const blockAction = (mdl, block) => mdl.state.hiddenBlock()
  ? () => moveBlock(mdl, block, true)
  : mdl.state.level() && mdl.state.status() !== 'COMPLETED' && selectHiddenBlockAndShuffle(mdl, block, 0)

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

const appClassList = mdl =>
  mdl.img.src() && mdl.state.screenSize() == 'TABLET' ? 'row' : 'col'


const headerHeight = (size, hasImage) => {
  switch (size) {
    case 'PHONE': return '33dvh'
    case 'TABLET': return hasImage ? '100dvh' : '33dvh'
    case 'DESKTOP': return hasImage ? '30dvh' : '30dvh'
  }
}


const justifyHeader = (mdl) => {
  switch (mdl.state.screenSize()) {
    case 'PHONE': return 'space-around'
    case 'TABLET': return mdl.img.src() ? 'space-evenly' : 'space-evenly'
    case 'DESKTOP': return mdl.img.src() ? 'space-evenly' : 'space-evenly'
  }
}


const appStyle = mdl =>
  mdl.img.src() && mdl.state.screenSize() == 'TABLET' &&
  { justifyContent: 'space-between' }

const headerStyle = mdl => ({
  height: headerHeight(mdl.state.screenSize(), mdl.img.src()),
  justifyContent: justifyHeader(mdl)

})

const titleStyle = mdl => ({
  left: mdl.state.screenSize() == 'TABLET' && mdl.img.src() ? 0 : 'inherit',
  fontSize: '3rem'
})

const inputStyle = mdl => ({
  justifyContent: mdl.state.screenSize() == 'TABLET' && !mdl.img.src() ? 'center' : 'flex-start'
})

const imgStyle = mdl => ({
  width: 'var(--size)',
  height: 'var(--size)',
  zIndex: mdl.img.display() ? 1000 : 0,
  opacity: () => mdl.img.display() ? 1 : 0.2
})

const toggleStyle = isDisabled => ({
  cursor: isDisabled ? 'not-allowed' : 'pointer'
})

export {
  newModel, upload, newGame, splitImage, isSwapBlock, isHiddenBlock, isDraggable, moveBlock, setBackground, selectHiddenBlockAndShuffle, selectLevel, calculateMovesTaken, isHistoryBlock, restart, calcStepsLeft, calculateMovesLeft, isLastHistoryBlock, blockBorder, blockClassList, blockAction, appClassList, appStyle, titleStyle, headerStyle, inputStyle, imgStyle, toggleStyle,
}
