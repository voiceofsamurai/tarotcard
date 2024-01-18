export class ContentItem {
  DOM = {
    el: null,
    title: null,
    text: null,
  };
  constructor(DOM_el) {
    this.DOM.el = DOM_el;
    this.DOM.title = this.DOM.el.querySelector(".content__item-title");
    this.DOM.text = this.DOM.el.querySelector(".content__item-text");
  }
}
