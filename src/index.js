import m from 'mithril'
import './styles.css'
import { newModel, upload, newGame, splitImage, isSwapBlock, isHiddenBlock, isDraggable, moveBlock, setBackground, selectHiddenBlockAndShuffle, selectLevel, calculateMovesTaken, saveImageToDesktop } from './model'


const Toolbar = {
  view: ({ attrs: { mdl } }) =>
    m('.col ',
      m('code.text', { style: { letterSpacing: '3px', fontSize: '2rem' } }, 'PHOTO SCRAMBLE!'),
      mdl.img.src() && m('button.btn', { onclick: () => newGame(mdl) }, 'New')
    )
}

const Block = () => {
  return {
    oncreate: ({ dom, attrs: { mdl, block } }) => {
      const origBlock = mdl.blocks.find(b => b.id == block.id)
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
        disabled: mdl.state.status() == 'completed',
        class: isHiddenBlock(mdl, block)
          ? 'isSwapBlock hiddenBlock'
          : isSwapBlock(mdl, block)
            ? 'point isSwapBlock'
            : mdl.state.status() == 'select square' && 'point',
        onclick: mdl.state.hiddenBlock()
          ? () => moveBlock(mdl, block)
          : mdl.state.level() && mdl.state.status() !== 'completed' && selectHiddenBlockAndShuffle(mdl, block, 0),
        draggable: isDraggable(mdl, block),
        style: {
          border:
            mdl.state.status() == 'select square' || (isSwapBlock(mdl, block) && mdl.state.status() !== 'completed') ?
              '2px solid var(--hilight)' : ''
        },
      },
        // isHistoryBlock(mdl, block) && m('p', mdl.swap.history.indexOf(block.id))
      )
    }
  }
}

const Grid = () => {
  return {
    onupdate: ({ attrs: { mdl } }) => {
      if (mdl.state.status() == 'select square') {
        mdl.originals = JSON.stringify(mdl.blocks.map(({ id, coords }) => ({ id, coords })))
        return true
      }
    },
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
        opacity: mdl.img.display() ? 1 : 0.1
      }
    })
}


const ImageSelector = {
  view: ({ attrs: { mdl } }) =>
    m('label.col.point',
      m('code.text', { for: 'upload' }, 'Upload an Image.'),
      m('input.btn',
        {
          name: 'upload',
          onchange: e => upload(mdl)(e).then(() => mdl.state.status('select level')),
          type: 'file',
          accept: 'image/gif, image/jpeg, image/png, image/*'
        }),
    )
}


const App = mdl => {
  return {
    view: () =>
      m('#app.col',
        m(Toolbar, { mdl }),
        mdl.swap.history.length
          ? m('pre.text', `Moves: ${calculateMovesTaken(mdl)}`) :
          mdl.img.src() && mdl.state.status() == 'select level' &&
          m('.col',
            m('code.text', 'Select a level'),
            m('.row', Object.keys(mdl.state.levels)
              .map(level => m('button.btn', { style: { border: `2px solid var(--hilight)` }, onclick: () => selectLevel(mdl, level) }, level))
            )
          ),
        mdl.img.src() && mdl.state.status() == 'select square' && [m('button.btn', { onclick: () => { mdl.state.level(null); mdl.state.status('select level') } }, 'change level'), m('code.text', 'Select a boring square to hide')],
        mdl.img.src()
          ? m('#viewer.row', [mdl.state.status() !== 'completed' && m(Grid, { mdl })], m(Img, { mdl }),)
          : m(ImageSelector, { mdl }),
        // m('button', { onclick: () => saveImageToDesktop(mdl, mdl.img.src()) }, 'download image'),
      ),
  }
}


m.mount(document.body, App(newModel()))
