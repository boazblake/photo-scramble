import m from 'mithril'
import Stream from 'mithril-stream'

const newModel = () => ({
  cell: {
    size: Stream(0),
  },
  state: {
    blocks: Stream([]),
    hiddenBlock: Stream(null),
    swapBlockIds: Stream([]),
    direction: Stream('horizontal'),
    size: Stream(0),
    colors: [],
    s: null,
    t: null,
  },
  img: {
    search: Stream(null),
    src: Stream(null),
    width: Stream(0),
    height: Stream(0),
    zIndex: Stream(0),
    display: Stream('intrinsic')
  }
})

const restart = mdl => {
  mdl.img.src(null)
  mdl.img.search(null)
  mdl.img.width(0)
  mdl.img.height(0)
  mdl.img.zIndex(0)
  mdl.img.display('intrinsic')

  mdl.state.blocks([])
  mdl.state.hiddenBlock(null)
  mdl.state.swapBlockIds([])
  mdl.state.direction('horizontal')
  mdl.state.size(0)

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

// const updateGame = (mdl, value) => {
//   // mdl.cell.size(Math.floor(((1 / mdl.state.size()) * mdl.img.width()) - 1));
//   mdl.state.blocks().map(toBlocks)
//   mdl.state.hiddenBlock(null)
//   mdl.img.display('none')
//   m.redraw()
// }


const getNeighbourIds = (mdl, id, target) => {
  const blockz = Array.from(target.parentNode.children)
  const hiddenBlock = blockz.find(b => b.id == id)
  // console.log(blockz)
  hiddenBlock.style.backgroundImage = ''
  const isNeighbour = block =>
    [100, 101].includes(distanceBetweenElements(hiddenBlock, block))

  return blockz.filter(isNeighbour).map(el => el.id)

}

export const splitImage = (mdl, image) => {
  const width = image.width;
  const height = image.height;
  const chunkWidth = Math.ceil(width / 25);
  const chunks = []
  for (let x = 0; x < width; x += chunkWidth) {
    const chunkCanvas = document.createElement('canvas');
    const chunkContext = chunkCanvas.getContext('2d');
    chunkCanvas.width = chunkWidth;
    chunkCanvas.height = height;
    chunkContext.drawImage(image, x, 0, chunkWidth, height, 0, 0, chunkWidth, height);
    chunks.push(chunkCanvas.toDataURL());
  }
  mdl.state.blocks(chunks.map(toBlocks))
  mdl.img.display('none')
}

const setupDrag = mdl => ({
  swap: true,
  delay: 0,
  direction: mdl.state.direction(),
  swapClass: ".w3-black",
  animation: 600,  // ms, animation speed moving items when sorting, `0` — without animation
  easing: "cubic-bezier(1, 0, 0, 1)", // Easing for animation. Defaults to null. See https://easings.net/ for examples.
  filter: ".w3-black",
  onEnd: (e) => {
    if (mdl.state.swapBlockIds().includes(e.swapItem.id)) return false
    const swappableBlockIds = getNeighbourIds(mdl, e.swapItem.id, e.swapItem)
    mdl.state.swapBlockIds(swappableBlockIds)
    m.redraw()
  },
  draggable: '.isSwapBlock',
  // onStart: e => e.item.classList = '.w3-card-4',
  onSort: e => {
    // console.log('sort', e)
  }
})


const upload = mdl => ({ target: { files } }) =>
  Promise.resolve(mdl.img.src(URL.createObjectURL(files[0])))

// const scramble = mdl => {
// let xs = [mdl.img.height(), mdl.img.width()].sort((a, b) => a - b)
// let size = Math.ceil(xs[0] / xs[1]) * 5
// let height = range(size).filter(x => (((mdl.img.height() % x) + x) % x) == 0)
// let width = range(size).filter(x => (((mdl.img.width() % x) + x) % x) == 0)
// let value = (Math.max(...height) / Math.max(...width))
// console.log('?', size, mdl.img.height(), mdl.img.width(),)
// mdl.state.size(size);
// mdl.state.blocks(size)
// updateGame(mdl, size)
// }


export { newModel, range, distanceBetweenElements, SIZES, uuid, getNeighbourIds, setupDrag, upload, restart }
