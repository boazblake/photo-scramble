import m from 'mithril'
import './styles.css'
import { newModel, upload, newGame, splitImage, isDraggable, setBackground, selectLevel, restart, getBorder, getAppClass, getAppStyle, getBlockClass, getAction, } from './model'
import { setupResponsiveness } from './utils'
import Logo from './logo.js'
import LogoStill from './files/logo/logo-still'

const Toolbar = {
  view: ({ attrs: { mdl } }) =>
    m('.row ',
      mdl.img.src() && m('button.btn', { onclick: () => newGame(mdl) }, 'New Image'),
      mdl.state.status() == 'select square' && m('button.btn', {
        onclick: () => { mdl.state.level(null); mdl.state.status('select level') }
      }, 'Change Level'),
      mdl.state.status() == 'ready' && m('button.btn', { onclick: () => restart(mdl) }, 'Restart'),
      mdl.state.status() == 'ready' && m("label.row",
        m('code', 'show hint'),
        m('label.switchContainer',
          m("input.switch#hint", { type: 'checkbox', onchange: () => mdl.state.showHint(!mdl.state.showHint()) }),
          m(".slider.round"),
        ))
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
        class: getBlockClass(mdl, block),
        onclick: getAction(mdl, block),
        draggable: isDraggable(mdl, block),
        style: { border: getBorder(mdl, block) },
      },
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
    view: ({ attrs: { mdl } }) => m('.grid#map', mdl.blocks.map((block) => m(Block, { mdl, block })))
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
        opacity: mdl.img.display() ? 1 : 0.2
      }
    })
}

const LevelSelector = {
  view: ({ attrs: { mdl } }) =>
    m('fieldset.col',
      m('legend.text', m('code', 'Select a level')),
      m('.row', Object.keys(mdl.state.levels)
        .map(level =>
          m('button.btn',
            {
              style: { border: `2px solid var(--hilight)` },
              onclick: () => selectLevel(mdl, level)
            }, level))
      )
    )
}
const ImageSelector = {
  view: ({ attrs: { mdl } }) =>
    m('fieldset.col.point',
      m('legend.text', m('code.text', m('label', { for: 'upload' }, 'Upload an Image.'))),
      m('input.btn',
        {
          style: { width: '80lvw' },
          name: 'upload',
          onchange: e => upload(mdl)(e).then(() => mdl.state.status('select level')),
          type: 'file',
          accept: 'image/gif, image/jpeg, image/png, image/*'
        }),
    )
}


const Header = {
  view: ({ attrs: { mdl } }) => m('section#header.col',
    m('code.text.row', { style: { justifyContent: 'center', letterSpacing: '3px', fontSize: '2rem' } }, 'PHOTO', m('#logo-still', m(LogoStill)),
      'SCRAMBLE!'),
    m(Toolbar, { mdl }),
    mdl.img.src() && [mdl.state.status() == 'select level' && m(LevelSelector, { mdl }),
    mdl.state.status() == 'select square' && m('code.text', 'Select a boring square to hide'),],
    mdl.swap.history.length > 0
    && m('section.col#user-info',
      m('pre.text', `Moves Made: ${mdl.state.userMoves()}`),
      m('pre.text', `Minimum Moves To Finish: ${mdl.state.levels[mdl.state.level()].count - 1}`)
    ))
}


const App = mdl => {
  setupResponsiveness(mdl)

  return {
    view: () =>
      m('#app', {
        style: getAppStyle(mdl),
        class: getAppClass(mdl)
      },
        m(Header, { mdl }),
        mdl.img.src()
          ? m('section.col#image-viewer',
            m('#viewer.row', mdl.state.status() !== 'completed' && m(Grid, { mdl }), m(Img, { mdl })))
          : m('section.col',
            m('#logo-anim', m(Logo)),
            m('#input-anim', m(ImageSelector, { mdl }))
          )
      )
  }

}


m.mount(document.body, App(newModel()))
