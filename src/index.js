import m from 'mithril'
import './styles.css'
import { newModel, upload, newGame, splitImage, isDraggable, setBackground, selectLevel, restart, getBorder, getAppClass, getAppStyle, getBlockClass, getAction, getTitleStyle, getHeaderStyle, getInputAnimStyle, getToggleStyle } from './model'
import { setupResponsiveness, } from './utils'
import logo from './images/photo-scramble-logo.png'
import loader from './images/logo-loader.gif'


const Toolbar = {
  view: ({ attrs: { mdl } }) =>
    m('.row ',
      mdl.img.src() && m('button.btn', { onclick: () => newGame(mdl) }, 'New Image'),
      mdl.state.status() == 'SELECT_SQR' && m('button.btn', {
        onclick: () => { mdl.state.level(null); mdl.state.status('SELECT_LEVEL') }
      }, 'Change Level'),
      mdl.state.status() == 'READY' && m('.row', m('button.btn', { onclick: () => restart(mdl) }, 'Restart'),
        m('button.btn', { onclick: () => mdl.state.help.open ? mdl.state.help.closeModal() : mdl.state.help.showModal() }, 'Help'))
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
        disabled: mdl.state.status() == 'COMPLETED',
        class: getBlockClass(mdl, block),
        onclick: getAction(mdl, block),
        draggable: isDraggable(mdl, block),
        style: { border: getBorder(mdl, block) },
      },
      )
    }
  }
}


const Toggle = {
  view: ({ attrs: { mdl, label, id, action, isDisabled } }) => m("label.row", { style: { width: '100%', justifyContent: 'space-between', lineHeight: '3rem' } },
    m('code', label),
    m('label.switchContainer',
      m(`input.switch#${id}`, {
        disabled: isDisabled(mdl),
        type: 'checkbox',
        onchange: () => action(mdl)
      }),
      m(".slider.round", { style: getToggleStyle(isDisabled(mdl)) }),
    ))
}

const Help = () => {
  return {
    oncreate: ({ attrs: { mdl }, dom }) => mdl.state.help = dom,
    view: ({ attrs: { mdl } }) =>
      m('dialog#dialog',
        { onclick: (e) => { e.target.id == 'dialog' && mdl.state.help.close() }, open: false },
        m('form.col',
          mdl.help.toggles.map(({ label, id, action, isDisabled }) =>
            m(Toggle, { mdl, label, id, action, isDisabled })),
        )
      )
  }
}

const Grid = () => {
  return {
    onupdate: ({ attrs: { mdl } }) => {
      if (mdl.state.status() == 'SELECT_SQR') {
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
        width: 'var(--size)',
        height: 'var(--size)',
        zIndex: mdl.img.display() ? 1000 : 0,
        opacity: mdl.state.showHiddenImage() ? 0 : mdl.img.display() ? 1 : 0.2
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
          onchange: e => upload(mdl)(e).then(() => mdl.state.status('SELECT_LEVEL')),
          type: 'file',
          accept: 'image/gif, image/jpeg, image/png, image/*'
        }),
    )
}

const Header = {
  view: ({ attrs: { mdl } }) =>
    m('section#header.col', { style: getHeaderStyle(mdl) },
      m('code#title.text.row', { style: getTitleStyle(mdl) }, 'PHOTO', m('img#logo-still', { src: logo, }),
        'SCRAMBLE!'),
      mdl.img.src() && m('.row',
        mdl.state.status() == 'SELECT_LEVEL' && m(LevelSelector, { mdl }),
        mdl.state.status() == 'SELECT_SQR' && m('code.text', 'Next, select a boring square on the grid to hide'))
      ,
      mdl.swap.history.length > 0 && m('section.col#user-info',
        m('code.text', `Moves Made: ${mdl.state.userMoves()}`),
        mdl.state.hintUsed() > 0 && m('code.text', { style: { color: 'var(--hint)' } }, `Moves With Hint: ${mdl.state.hintUsed()}`),
        m('code.text', `Perfect Score Is: ${mdl.state.levels[mdl.state.level()].count - 1}`)
      ),
      mdl.state.screenSize() == 'TABLET' && m(Toolbar, { mdl }),
    )
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
            m('#viewer.row',
              mdl.state.status() !== 'COMPLETED' && m(Grid, { mdl }), m(Img, { mdl })),
            mdl.state.screenSize() !== 'TABLET' && m(Toolbar, { mdl }))
          : m('section.col', { style: getInputAnimStyle(mdl) },
            m('#logo-anim', m('img', { src: loader, })),
            m('#input-anim', m(ImageSelector, { mdl }))
          ),
        m(Help, { mdl })
      )
  }

}


m.mount(document.body, App(newModel()))
