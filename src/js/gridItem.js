export class GridItem {
  DOM = {
    el: null,
    img: {
      outer: null,
      inner: null
    },
    caption: null,
    contentId: null,
    contentItem: null
  };
  position = -1;
  constructor(DOM_el) {
    this.DOM.el = DOM_el;
    this.DOM.img.outer = this.DOM.el.querySelector('.column__item-imgwrap');
    this.DOM.img.inner = this.DOM.el.querySelector('.column__item-img');
    this.position = Number(this.DOM.img.outer.dataset.pos) - 1;
    this.DOM.caption = this.DOM.el.querySelector('figcaption');
  }
}