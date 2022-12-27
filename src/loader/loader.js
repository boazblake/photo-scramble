import m from 'mithril'

const Loader = {
  view: () => m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "200px", "height": "200px", "viewBox": "0 0 100 100", "preserveAspectRatio": "xMidYMid", "style": { "margin": "auto", "background": "rgb(241, 242, 243)", "display": "block", "shape-rendering": "auto" } },
    [
      m("rect", { "x": "19", "y": "19", "width": "20", "height": "20", "fill": "#1de9b6" },
        m("animate", { "attributeName": "fill", "values": "#ffa500;#1de9b6;#1de9b6", "keyTimes": "0;0.125;1", "dur": "1s", "repeatCount": "indefinite", "begin": "0s", "calcMode": "discrete" })
      ),
      m("rect", { "x": "40", "y": "19", "width": "20", "height": "20", "fill": "#1de9b6" },
        m("animate", { "attributeName": "fill", "values": "#ffa500;#1de9b6;#1de9b6", "keyTimes": "0;0.125;1", "dur": "1s", "repeatCount": "indefinite", "begin": "0.125s", "calcMode": "discrete" })
      ),
      m("rect", { "x": "61", "y": "19", "width": "20", "height": "20", "fill": "#1de9b6" },
        m("animate", { "attributeName": "fill", "values": "#ffa500;#1de9b6;#1de9b6", "keyTimes": "0;0.125;1", "dur": "1s", "repeatCount": "indefinite", "begin": "0.25s", "calcMode": "discrete" })
      ),
      m("rect", { "x": "19", "y": "40", "width": "20", "height": "20", "fill": "#1de9b6" },
        m("animate", { "attributeName": "fill", "values": "#ffa500;#1de9b6;#1de9b6", "keyTimes": "0;0.125;1", "dur": "1s", "repeatCount": "indefinite", "begin": "0.875s", "calcMode": "discrete" })
      ),
      m("rect", { "x": "61", "y": "40", "width": "20", "height": "20", "fill": "#1de9b6" },
        m("animate", { "attributeName": "fill", "values": "#ffa500;#1de9b6;#1de9b6", "keyTimes": "0;0.125;1", "dur": "1s", "repeatCount": "indefinite", "begin": "0.375s", "calcMode": "discrete" })
      ),
      m("rect", { "x": "19", "y": "61", "width": "20", "height": "20", "fill": "#1de9b6" },
        m("animate", { "attributeName": "fill", "values": "#ffa500;#1de9b6;#1de9b6", "keyTimes": "0;0.125;1", "dur": "1s", "repeatCount": "indefinite", "begin": "0.75s", "calcMode": "discrete" })
      ),
      m("rect", { "x": "40", "y": "61", "width": "20", "height": "20", "fill": "#1de9b6" },
        m("animate", { "attributeName": "fill", "values": "#ffa500;#1de9b6;#1de9b6", "keyTimes": "0;0.125;1", "dur": "1s", "repeatCount": "indefinite", "begin": "0.625s", "calcMode": "discrete" })
      ),
      m("rect", { "x": "61", "y": "61", "width": "20", "height": "20", "fill": "#1de9b6" },
        m("animate", { "attributeName": "fill", "values": "#ffa500;#1de9b6;#1de9b6", "keyTimes": "0;0.125;1", "dur": "1s", "repeatCount": "indefinite", "begin": "0.5s", "calcMode": "discrete" })
      )
    ]
  )
}

export default Loader
