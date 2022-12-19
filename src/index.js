import m from 'mithril'
import './styles.css'
// import { Sortable, Swap } from 'sortablejs';
import { newModel, upload, getNeighbourIds, restart, splitImage } from './model'




const Toolbar = {
  view: ({ attrs: { mdl } }) => mdl.img.src() && m('.toolbar ',
    m('. ',
      // m(SizeSelector, { mdl })
      // m('button', { onclick: () => scramble(mdl) }, 'Scramble')
    ),
    m('. ',
      m('button', { onclick: () => restart(mdl) }, 'Restart')
    )
  )
}

const Block = ({ attrs: { selectHiddenBlock } }) => {
  return {
    oncreate: ({ dom, attrs: { mdl, block } }) => {
      const coords = dom.getBoundingClientRect()
      block.coords = coords
      dom.style.backgroundImage = `url(${JSON.stringify(mdl.img.src())})`
      dom.style.backgroundSize = `${mdl.img.width()}px ${mdl.img.height()}px`
      dom.style.backgroundPosition = `${mdl.img.coords.left - coords.left}px ${mdl.img.coords.top - coords.top}px`
      dom.style.backgroundRepeat = 'no-repeat'
    },
    ondragstart: (event) => {
      event.preventDefault();

      console.log(event)
      mdl.state.s = { index, color }
      mdl.state.dragging = true
      // Set the data that will be transferred when the element is dragged
      event.dataTransfer.setData('color', color);
    },
    ondragenter: (event) => {
      // Allow the drop event to occur
      event.preventDefault();
      mdl.state.t = { index, color }
    },
    ondragover: (event) => {
      // Allow the drop event to occur
      event.preventDefault();
      mdl.state.t = { index, color }
    },
    ondragend: (e) => {
      e.preventDefault();

      if (mdl.state.swapBlockIds().includes(e.swapItem.id)) return false
      const swappableBlockIds = getNeighbourIds(mdl, e.swapItem.id, e.swapItem)
      mdl.state.swapBlockIds(swappableBlockIds)
      m.redraw()
    },
    ondrop: (event) => {
      event.preventDefault();

      console.log(event)

      // Retrieve the data that was set in the ondragstart event
      const color1 = mdl.state.s.color//event.dataTransfer.getData('color');
      // Get the index of the square being dragged
      const index1 = mdl.state.s.index// mdl.state.blocks.indexOf(color1);
      // Get the index of the square being dropped on
      const index2 = mdl.state.t.index //mdl.state.blocks.indexOf(color);
      // Check if the squares are adjacent
      if (Math.abs(index1 - index2) === 1 || Math.abs(index1 - index2) === 5) {
        // Swap the mdl.state.blocks of the squares using array destructuring
        [mdl.state.blocks[index1], mdl.state.blocks[index2]] = [mdl.state.blocks[index2], mdl.state.blocks[index1]];
      } else {
        // Invert the mdl.state.blocks of the squares
        mdl.state.blocks[index1] = invertColor(color1);
        mdl.state.blocks[index2] = invertColor(color);
      }
      mdl.state.dragging = false
      mdl.state.s = null
      mdl.state.t = null
    },
    view: ({ attrs: { mdl, block, isHiddenBlock, idx, isSwapBlock } }) => {
      // console.log(block, isHiddenBlock, isSwapBlock)
      return m('.block', {
        id: block.id,
        class: isHiddenBlock ? 'isSwapBlock' : isSwapBlock ? 'grab isSwapBlock' : !mdl.state.hiddenBlock() && 'point',
        onclick: !mdl.state.hiddenBlock() && selectHiddenBlock(block.id),
        draggable: isHiddenBlock ? null : isSwapBlock,
        // style: { width: `${mdl.cell.size()}px`, height: `${mdl.cell.size()}px` }
      })
    }
  }
}

const Board = ({ attrs: { mdl } }) => {
  const selectHiddenBlock = id => ({ target }) => {
    if (mdl.state.hiddenBlock() == id) {
      mdl.state.hiddenBlock(null)
      mdl.state.swapBlockIds([])
    } else {
      mdl.state.hiddenBlock(id)

      const swappableBlockIds = getNeighbourIds(mdl, id, target)
      mdl.state.swapBlockIds(swappableBlockIds)
    }
  }
  return {
    view: ({ attrs: { mdl } }) =>
      m('.grid#map',
        { style: { width: `${mdl.img.width()}px`, height: `${mdl.img.height()}px`, } },
        mdl.state.blocks().map((block, idx) =>
          m(Block, { idx, mdl, block, selectHiddenBlock, isSwapBlock: mdl.state.swapBlockIds().includes(block.id), isHiddenBlock: mdl.state.hiddenBlock() == (block.id) })
        )
      )
  }
}

const Img = {
  view: ({ attrs: { mdl } }) => m("img#img",
    {
      onload: ({ target }) => {
        mdl.img.width(target.width)
        mdl.img.height(target.height)
        mdl.img.coords = target.getBoundingClientRect()
        splitImage(mdl, target)
      },
      "src": mdl.img.src(),
      style: {
        minWidth: '500px',
        minHeight: '500px',
        maxWidth: '500px',
        maxHeight: '500px',
        width: '500px',
        height: '500px',
        zIndex: mdl.img.zIndex(),
        display: mdl.img.display()
      }
    })
}


const ImageSelector = {
  view: ({ attrs: { mdl } }) =>
    m('section', { style: { height: '100vh' } },
      m('.',
        m('label', 'Upload an image...',
          m('input', { onchange: upload(mdl), type: 'file', accept: "image/gif, image/jpeg, image/png" })),
        m('label', '...Or enter a URL of an image',
          m('input', { onkeyup: e => { e.key == 'Enter' ? mdl.img.src(mdl.img.search()) : mdl.img.search(e.target.value) }, type: 'text', accept: "url" })),
      )
    )
}


const App = mdl => {
  return {
    view: () =>
      m('', m('#app',
        m(Toolbar, { mdl }),
        mdl.img.src()
          ? m('#viewer', m(Board, { mdl }), m(Img, { mdl }),)
          : m(ImageSelector, { mdl })
      ),
        m('pre', { style: { display: 'block' } }, JSON.stringify(mdl, null, 4)),)
  }
}


m.mount(document.body, App(newModel()))
