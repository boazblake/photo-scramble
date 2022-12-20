import m from 'mithril'
import './styles.css'
import { newModel, upload, newGame, splitImage, isSwapBlock, isHiddenBlock, isDraggable, moveBlock, setBackground, selectHiddenBlockAndShuffle, selectLevel } from './model'




const Toolbar = {
  view: ({ attrs: { mdl } }) => mdl.img.src() && m('.toolbar ', m('button.btn', { onclick: () => newGame(mdl) }, 'New'))
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
      setBackground(mdl, block, dom)
    },
    view: ({ attrs: { mdl, block } }) => {
      return m('.block', {
        id: block.id,
        class: isHiddenBlock(mdl, block)
          ? 'isSwapBlock hiddenBlock'
          : isSwapBlock(mdl, block)
            ? 'point isSwapBlock'
            : mdl.state.status() == 'select square' && 'point',
        onclick: mdl.state.hiddenBlock() ? () => moveBlock(mdl, block) : mdl.state.level() && selectHiddenBlockAndShuffle(mdl, block, 0),
        draggable: isDraggable(mdl, block),
        style: {
          border:
            mdl.state.status() == 'select square' || isSwapBlock(mdl, block) ?
              '2px solid var(--hilight)' : ''
          //  ? isSwapBlock(mdl, block) ? '2px solid gold' : '' :
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
  view: ({ attrs: { mdl } }) => m('img#img',
    {
      onload: ({ target }) => {
        mdl.img.width(target.width)
        mdl.img.height(target.height)
        mdl.img.coords = target.getBoundingClientRect()
        splitImage(mdl, target)
      },
      'src': mdl.img.src(),
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
    m('.col',
      m('code.underline', { style: { fontSize: '2rem' } }, 'Upload an Image.'),
      m('input.btn', { onchange: e => upload(mdl)(e).then(() => mdl.state.status('select level')), type: 'file', accept: 'image/gif, image/jpeg, image/png, image/*' }),
    )
}


const App = mdl => {
  return {
    view: () =>
      m('#app.col',
        m(Toolbar, { mdl }),
        mdl.swap.history.length
          ? m('pre', { style: { fontSize: '2rem' } }, `Moves: ${mdl.swap.history.length - mdl.state.levels[mdl.state.level()].subtract}`) :
          mdl.img.src() && mdl.state.status() == 'select level' &&
          m('.col',
            m('code.underline', { style: { fontSize: '2rem' } }, 'Select a level'),
            m('.row',
              m('button.btn', { onclick: () => selectLevel(mdl, 'easy') }, 'easy'),
              m('button.btn', { onclick: () => selectLevel(mdl, 'medium') }, 'medium'),
              m('button.btn', { onclick: () => selectLevel(mdl, 'hard') }, 'hard'),
            )
          ),
        mdl.img.src() && mdl.state.status() == 'select square' && [m('button.btn', { onclick: () => { mdl.state.level(null); mdl.state.status('select level') } }, 'change level'), m('code.underline', { style: { fontSize: '2rem' } }, 'Select a boring square to hide')],
        mdl.img.src()
          ? m('#viewer.row', m(Grid, { mdl }), m(Img, { mdl }),)
          : m(ImageSelector, { mdl }),
      ),
  }
}


m.mount(document.body, App(newModel()))
