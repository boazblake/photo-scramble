import m from 'mithril'
import './styles.css'
import { Sortable, Swap } from 'sortablejs';
import { newModel, SIZES, getNeighbourIds, setupDrag, upload, updateGame, restart, scramble } from './model'


const SizeSelector = () => {
  const updateSize = mdl =>
    ({ target: { value } }) => {
      // mdl.img.display('intrinsic')
      mdl.state.size(value);
      mdl.state.blocks(null)
      updateGame(mdl, value)
    }
  return {
    view: ({ attrs: { mdl } }) =>
      m('select.w3-select.w3-bar-item.', { onchange: updateSize(mdl) }, SIZES.map(s => m('option', s)))
  }
}

const Toolbar = {
  view: ({ attrs: { mdl } }) => mdl.img.src() && m('.toolbar.w3-bar',
    m('.w3-left.w3-bar-item',
      // m(SizeSelector, { mdl })
      m('button', { onclick: () => scramble(mdl) }, 'Scramble')
    ),
    m('.w3-right.w3-bar-item',
      m('button', { onclick: () => restart(mdl) }, 'Restart')
    )
  )
}

const Block = ({ attrs: { selectHiddenBlock } }) => {
  return {
    oncreate: ({ dom, attrs: { mdl } }) => {
      const coords = dom.getBoundingClientRect()
      dom.style.backgroundImage = `url(${JSON.stringify(mdl.img.src())})`
      dom.style.backgroundSize = `${mdl.img.width()}px ${mdl.img.height()}px`
      dom.style.backgroundPosition = `${mdl.img.coords.left - coords.left}px ${mdl.img.coords.top - coords.top}px`
      dom.style.backgroundRepeat = 'no-repeat'
    },
    view: ({ attrs: { mdl, block, isHiddenBlock, idx, isSwapBlock } }) =>
      m('.w3-col point', {
        id: block.id,
        class: isHiddenBlock ? 'w3-black isSwapBlock' : isSwapBlock ? 'w3-card grab isSwapBlock' : 'w3-card point',
        onclick: !mdl.state.hiddenBlock() && selectHiddenBlock(block.id),
        draggable: isSwapBlock && !isHiddenBlock,
        style: { width: `${mdl.cell.size()}px`, height: `${mdl.cell.size()}px` }
      })
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
    oncreate: ({ dom, attrs: { mdl } }) => mdl.sortable = new Sortable(dom, setupDrag(mdl)),
    view: ({ attrs: { mdl } }) =>
      m('#map.w3-row',
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
      oncreate: ({ dom }) => {
        console.log('create', dom.height)
      },
      onload: ({ target }) => {
        console.log('load', target.height)
        mdl.img.width(target.width)
        mdl.img.height(target.height)
        mdl.img.coords = target.getBoundingClientRect()
      },
      "src": mdl.img.src(),
      style: {
        maxwidth: '400px',
        height: 'auto',
        zIndex: mdl.img.zIndex(),
        display: mdl.img.display()
      }
    })
}




const ImageSelector = {
  view: ({ attrs: { mdl } }) =>
    m('section.w3-section.w3-display-container', { style: { height: '100vh' } },
      m('.w3-display-middle',
        m('label.w3-label', 'Upload an image...',
          m('input.w3-input', { onchange: upload(mdl), type: 'file', accept: "image/gif, image/jpeg, image/png" })),
        m('label.w3-label', '...Or enter a URL of an image',
          m('input.w3-input', { onkeyup: e => { e.key == 'Enter' ? mdl.img.src(mdl.img.search()) : mdl.img.search(e.target.value) }, type: 'text', accept: "url" })),
      )
    )
}


const App = mdl => {
  Sortable.mount(new Swap());
  return {
    view: () =>
      m('#app.w3-container',
        m(Toolbar, { mdl }),
        mdl.img.src()
          ? m('#viewer', m(Board, { mdl }), m(Img, { mdl }))
          : m(ImageSelector, { mdl })
      )
  }
}


m.mount(document.body, App(newModel()))
