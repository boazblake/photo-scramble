import m from 'mithril'
import './styles.css'
import { newModel, upload, selectHiddenBlock, newGame, splitImage, isSwapBlock, isHiddenBlock, isDraggable, moveBlock } from './model'




const Toolbar = {
  view: ({ attrs: { mdl } }) => mdl.img.src() && m('.toolbar ',
    m('. ',
      m('button', { onclick: () => newGame(mdl) }, 'New'),
    )
  )
}

const Block = () => {
  return {
    oncreate: ({ dom, attrs: { mdl, block } }) => {
      const origBlock = mdl.originals.find(b => b.id == block.id)
      const coords = dom.getBoundingClientRect()
      block.coords = coords
      origBlock.coords = coords
      block.dom = dom
      origBlock.dom = dom
      dom.style.backgroundImage = `url(${JSON.stringify(mdl.img.src())})`
      dom.style.backgroundSize = `${mdl.img.width()}px ${mdl.img.height()}px`
      dom.style.backgroundPosition = `${mdl.img.coords.left - coords.left}px ${mdl.img.coords.top - coords.top}px`
      dom.style.backgroundRepeat = 'no-repeat'
    },
    view: ({ attrs: { mdl, block } }) => {
      return m('.block', {
        id: block.id,
        class: isHiddenBlock(mdl, block)
          ? 'isSwapBlock hiddenBlock'
          : isSwapBlock(mdl, block)
            ? 'point isSwapBlock'
            : !mdl.state.hiddenBlock() && 'point',
        onclick: mdl.state.hiddenBlock() ? moveBlock(mdl, block) : selectHiddenBlock(mdl, block.id),
        draggable: isDraggable(mdl, block),
        style: {
          // boxSizing: 'border-box', border: mdl.state.hiddenBlock() ? isSwapBlock(mdl, block) ? '2px solid gold' : '' : '2px solid aqua'
        },
      },
        // isHistoryBlock(mdl, block) && m('p', mdl.swap.history.indexOf(block.id))
      )
    }
  }
}

const Grid = ({ attrs: { mdl } }) => {

  return {
    view: ({ attrs: { mdl } }) =>
      m('.grid#map', mdl.blocks.map((block, idx) => m(Block, { idx, mdl, block })))
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
        minWidth: 'var(--size)',
        minHeight: 'var(--size)',
        maxWidth: 'var(--size)',
        maxHeight: 'var(--size)',
        width: 'var(--size)',
        height: 'var(--size)',
        zIndex: mdl.img.zIndex(),
        opacity: mdl.img.display() ? 1 : 0.1
      }
    })
}


const ImageSelector = {
  view: ({ attrs: { mdl } }) =>
    m('section', { style: { height: '100vh' } },
      m('.',
        m('label', 'Upload an image...',
          m('input', { onchange: upload(mdl), type: 'file', accept: "image/gif, image/jpeg, image/png" })),
      )
    )
}


const App = mdl => {
  return {
    view: () =>
      m('#app.col',
        m(Toolbar, { mdl }),
        mdl.img.src()
          ? m('#viewer.row', m(Grid, { mdl }), m(Img, { mdl }),)
          : m(ImageSelector, { mdl }),
        mdl.swap.history.length ? m('pre', { style: { fontSize: '5rem' } }, mdl.swap.history.length - 1) :
          m('pre', { style: { fontSize: '2rem' } }, 'Select a square to hide')
      ),
  }
}


m.mount(document.body, App(newModel()))
