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


const toBlocks = (width, cellSize, imgHeight) => {
  const height = Math.floor(imgHeight / cellSize)
  return range(width * height).map(_ => ({ id: uuid(), coords: { x1: '', x2: '', y1: '', y2: '' } }))
}

const updateGame = (mdl, value) => {
  mdl.cell.size(Math.floor(((1 / mdl.state.size()) * mdl.img.width()) - 1));
  mdl.state.blocks(toBlocks(value, mdl.cell.size(), mdl.img.height()))
  mdl.state.hiddenBlock(null)
  mdl.img.display('none')
}


const getNeighbourIds = (mdl, id, target) => {
  const blockz = Array.from(target.parentNode.children)
  const hiddenBlock = blockz.find(b => b.id == id)
  hiddenBlock.style.backgroundImage = ''
  const isNeighbour = size => block =>
    distanceBetweenElements(hiddenBlock, block) == size

  return blockz.filter(isNeighbour(mdl.cell.size())).map(el => el.id)

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


const upload = mdl => ({ target: { files } }) => {
  const reader = new FileReader()
  reader.onloadend = _ => {
    mdl.img.src(reader.result)
    m.redraw()
  }
  reader.readAsDataURL(files[0])
}


const scramble = mdl => {
  let xs = [mdl.img.height(), mdl.img.width()].sort((a, b) => a - b)
  let size = Math.floor(xs[0] / xs[1]) * 10
  // let height = range(size).filter(x => (((mdl.img.height() % x) + x) % x) == 0)
  // let width = range(size).filter(x => (((mdl.img.width() % x) + x) % x) == 0)
  // let value = (Math.max(...height) / Math.max(...width))
  console.log(size, mdl.img.height(), mdl.img.width(),)
  mdl.state.size(size);
  // mdl.state.blocks(null)
  updateGame(mdl, size)
}


export { newModel, range, distanceBetweenElements, SIZES, uuid, getNeighbourIds, setupDrag, upload, updateGame, restart, scramble }
