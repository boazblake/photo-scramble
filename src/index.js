import m from 'mithril'
import './styles.css'
import { newModel, upload, selectHiddenBlock, restart, splitImage, isSwapBlock, isHiddenBlock, isHistoryBlock, isDraggable } from './model'




const Toolbar = {
  view: ({ attrs: { mdl } }) => mdl.img.src() && m('.toolbar ',
    m('. ',
      m('button', { onclick: () => restart(mdl) }, 'Restart')
    )
  )
}

const Block = ({ attrs: { mdl, block } }) => {

  return {
    oncreate: ({ dom, attrs: { mdl, block } }) => {
      const coords = dom.getBoundingClientRect()
      // console.log('oncreate', block)
      block.coords = coords
      block.dom = dom
      dom.style.backgroundImage = `url(${JSON.stringify(mdl.img.src())})`
      dom.style.backgroundSize = `${mdl.img.width()}px ${mdl.img.height()}px`
      dom.style.backgroundPosition = `${mdl.img.coords.left - coords.left}px ${mdl.img.coords.top - coords.top}px`
      dom.style.backgroundRepeat = 'no-repeat'
    },
    view: ({ attrs: { mdl, block, idx } }) => {
      // const block = getBlockById(mdl, id)
      return m('.block', {
        id: block.id,
        class: isHiddenBlock(mdl, block) ? 'isSwapBlock hiddenBlock' : isSwapBlock(mdl, block) ? 'grab isSwapBlock' : !mdl.state.hiddenBlock() && 'point',
        onclick: !mdl.state.hiddenBlock() && selectHiddenBlock(mdl, block.id),
        draggable: isDraggable(mdl, block),
        style: {
          border: isHistoryBlock(mdl, block) ? '1px solid orange' : ''
        },
        ondragstart: (event) => {
          mdl.swap.src = { coords: block.coords, id: block.id, dom: block.dom, idx }
          mdl.swap.dragging = true
        },
        ondragenter: (event) => {
          event.preventDefault();
          mdl.swap.target = { coords: block.coords, id: block.id, dom: block.dom, idx }
          return true
        },
        ondragleave: (event) => {
          event.preventDefault();
          mdl.swap.target = { coords: block.coords, id: block.id, dom: block.dom, idx }
          return true
        },
        ondragover: (event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          mdl.swap.target = { coords: block.coords, id: block.id, dom: block.dom, idx }
          return true
        },
        ondragend: (e) => {
          mdl.swap.target = { coords: block.coords, id: block.id, dom: block.dom, idx }
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          return true
        },
        ondrop: (event) => {

          if (!isHiddenBlock(mdl, block)) return false

          event.preventDefault();


          const idxS = mdl.swap.src.idx
          const idxT = mdl.swap.target.idx
          const coordS = mdl.swap.src.coords
          const coordT = mdl.swap.target.coords

          mdl.blocks[idxS].coords = coordT
          mdl.blocks[idxT].coords = coordS

          const domT = mdl.swap.target.dom
          selectHiddenBlock(mdl, mdl.swap.src.id)({ target: mdl.swap.src.dom })
          domT.style.backgroundImage = `url(${JSON.stringify(mdl.img.src())})`
          domT.style.backgroundSize = `${mdl.img.width()}px ${mdl.img.height()}px`
          domT.style.backgroundPosition = `${mdl.img.coords.left - mdl.swap.src.coords.left}px ${mdl.img.coords.top - mdl.swap.src.coords.top}px`
          domT.style.backgroundRepeat = 'no-repeat'
          mdl.swap.dragging = false
          mdl.swap.src = { idx: null, id: null, dom: null, img: null }
          mdl.swap.target = { idx: null, id: null, dom: null, img: null }
          return true
        },
        onupdate: (vnode) => {
          if ([mdl.swap.src.id, mdl.swap.target.id].includes(block.id) && !mdl.swap.dragging) {
            console.log(vnode)
            vnode.dom.classList.remove("first", "last", "invert", "play");
            vnode.dom.classList.add("last");
            setTimeout(() => {
              vnode.dom.classList.remove("last");
              vnode.dom.classList.add("invert");
              m.redraw()
            }, 100);
            setTimeout(() => {
              vnode.dom.classList.remove("invert");
              vnode.dom.classList.add("play");
              m.redraw()
            }, 200);
            setTimeout(() => {
              vnode.dom.classList.remove("play");
              vnode.dom.classList.add("first");
              m.redraw()
            }, 300);
            mdl.swap.src = { idx: null, id: null, dom: null, img: null }
            mdl.swap.target = { idx: null, id: null, dom: null, img: null }
          }
          else return false
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
