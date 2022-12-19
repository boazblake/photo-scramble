import m from 'mithril'
import './styles.css'
import { newModel, upload, selectHiddenBlock, newGame, splitImage, isSwapBlock, isHiddenBlock, isHistoryBlock, isDraggable, moveBlock } from './model'




const Toolbar = {
  view: ({ attrs: { mdl } }) => mdl.img.src() && m('.toolbar ',
    m('. ',
      m('button', { onclick: () => newGame(mdl) }, 'New'),
      m('button', {
        onclick: () => {
          const img = mdl.img.src()
          newGame(mdl)
          upload(mdl)({ target: { files: [mdl.file] } })
        }
      }, 'Restart')
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
        class: isHiddenBlock(mdl, block) ? 'isSwapBlock hiddenBlock' : isSwapBlock(mdl, block) ? 'point isSwapBlock' : !mdl.state.hiddenBlock() && 'point',
        onclick: mdl.state.hiddenBlock() ? moveBlock(mdl, block) : selectHiddenBlock(mdl, block.id),
        draggable: isDraggable(mdl, block),
        style: {
          border: isHistoryBlock(mdl, block) ? '1px solid orange' : ''
        },
      }, isHistoryBlock(mdl, block) && m('p', mdl.swap.history.indexOf(block.id)))
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
        // m('label', '...Or enter a URL of an image',
        //   m('input', { onkeyup: e => { e.key == 'Enter' ? mdl.img.src(mdl.img.search()) : mdl.img.search(e.target.value) }, type: 'text', accept: "url" })),
      )
    )
}


const App = mdl => {
  return {
    view: () =>
      m('',
        m('#app',
          m(Toolbar, { mdl }),
          mdl.img.src()
            ? m('#viewer', m(Grid, { mdl }), m(Img, { mdl }),)
            : m(ImageSelector, { mdl })
        ),
        m('pre', { style: { display: 'block' } }, JSON.stringify(mdl.swap.history, null, 4)),)
  }
}


m.mount(document.body, App(newModel()))
