import Stream from 'mithril-stream'
import m from 'mithril'
const newModel = () => ({
  cell: {
    size: Stream(0),
  },
  blocks: [],
  originals: [],
  swap: {
    isDragging: false,
    swapBlockIds: [],
    history: [],
  },
  state: {
    hiddenBlock: Stream(null),
    direction: Stream('horizontal'),
    size: Stream(0),
  },
  img: {
    search: Stream(null),
    src: Stream(null),
    width: Stream(0),
    height: Stream(0),
    zIndex: Stream(0),
    display: Stream(true)
  }
})

const newGame = mdl => {
  mdl.blocks = []
  mdl.img.src(null)
  mdl.img.search(null)
  mdl.img.width(0)
  mdl.img.height(0)
  mdl.img.zIndex(0)
  mdl.img.display(true)

  mdl.state.hiddenBlock(null)
  mdl.state.direction('horizontal')
  mdl.state.size(0)

  mdl.swap.isDragging = false
  mdl.swap.src = { coords: null, idx: null, id: null, dom: null, img: null }
  mdl.swap.target = { coords: null, idx: null, id: null, dom: null, img: null }
  mdl.swap.swapBlockIds = []
  mdl.swap.history = []

  mdl.cell.size(0)
  return mdl
}

window.log = m => v => {
  console.log(m, v)
  return v
}
const range = (size) => [...Array(parseInt(size)).keys()]

const distanceBetweenElements = (el1, el2) => {
  const x1 = el1.offsetTop;
  const y1 = el1.offsetLeft;
  const x2 = el2.offsetTop;
  const y2 = el2.offsetLeft;
  const xDistance = x1 - x2;
  const yDistance = y1 - y2;
  return Math.sqrt((xDistance * xDistance) + (yDistance * yDistance));
}


const SIZES = [0, 3, 4, 5, 6]

const uuid = () =>
  "xxxxxxxx".replace(/[xy]/g, (c) => {
    let r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });


export const toBlocks = (img, idx) => {
  return ({ img, idx, id: uuid(), coords: { x1: '', x2: '', y1: '', y2: '' } })
}

const getNeighbourIds = (mdl, id, target) => {
  const divs = Array.from(target.parentNode.children)
  const hiddenDiv = divs.find(b => b.id == id)
  const hiddenBlock = mdl.blocks.find(b => b.id == id)
  hiddenDiv.style.backgroundImage = ''
  const isNeighbour = div => {
    console.log(distanceBetweenElements(hiddenDiv, div))
    return (distanceBetweenElements(hiddenDiv, div)) > 100 && (distanceBetweenElements(hiddenDiv, div)) < 120
  }

  return divs.filter(isNeighbour).map(el => el.id)

}

export const splitImage = (mdl, image) => {
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
  mdl.originals = structuredClone(blocks)
  m.redraw()
  mdl.img.display(false)
}

const upload = mdl => ({ target: { files } }) => {
  mdl.file = files[0]
  return Promise.resolve(mdl.img.src(URL.createObjectURL(mdl.file)))
}

export const selectHiddenBlock = (mdl, id) => ({ target }) => {
  mdl.swap.history.push(id)
  mdl.state.hiddenBlock(id)
  mdl.swap.swapBlockIds = getNeighbourIds(mdl, id, target)
}

const isSwapBlock = (mdl, block) => mdl.swap.swapBlockIds.includes(block.id)
const isHiddenBlock = (mdl, block) => block.id == mdl.state.hiddenBlock()
const isHistoryBlock = (mdl, block) => mdl.swap.history.includes(block.id)
const isDraggable = (mdl, block) => {
  if (mdl.swap.isDragging) {
    return isHiddenBlock(mdl, block)
  } else {
    return isSwapBlock(mdl, block) || isHiddenBlock(mdl, block)
  }
}
const moveBlock = (mdl, block) => event => {
  if (!mdl.swap.swapBlockIds.includes(block.id)) return
  event.preventDefault();
  const id = mdl.state.hiddenBlock()
  const target = mdl.blocks.find(b => b.id == id)
  const domT = target.dom
  const tempCoords = target.coords
  target.coords = block.coords
  domT.style.backgroundImage = `url(${JSON.stringify(mdl.img.src())})`
  domT.style.backgroundSize = `${mdl.img.width()}px ${mdl.img.height()}px`
  domT.style.backgroundPosition = `${mdl.img.coords.left - block.coords.left}px ${mdl.img.coords.top - block.coords.top}px`
  domT.style.backgroundRepeat = 'no-repeat'
  mdl.swap.dragging = false
  block.coords = tempCoords
  selectHiddenBlock(mdl, block.id)({ target: block.dom })
  return true
}

export { newModel, range, distanceBetweenElements, SIZES, uuid, getNeighbourIds, upload, moveBlock, newGame, isSwapBlock, isHiddenBlock, isHistoryBlock, isDraggable }
