import { calcWinsize, adjustedBoundingRect } from "./utils";
import LocomotiveScroll from "locomotive-scroll";
import { GridItem } from "./gridItem";
import { ContentItem } from "./contentItem";
import { gsap } from "gsap";
const bodyEl = document.body;
let winsize = calcWinsize();
window.addEventListener("resize", () => (winsize = calcWinsize()));

export class Grid {
  DOM = {
    el: null,
    oddColumns: null,
    gridItems: null,
    content: document.querySelector(".content"),
    contentItems: document.querySelectorAll(".content__item"),
    heading: {
      top: document.querySelector(".heading--up"),
      bottom: document.querySelector(".heading--down"),
    },
    backCtrl: document.querySelector(".button-back"),
    contentNav: document.querySelector(".content__nav"),
    contentNavItems: document.querySelectorAll(".content__nav-item"),
  };
  gridItemArr = [];
  currentGridItem = -1;
  isGridView = true;
  isAnimating = false;
  lastscroll = 0;
  constructor(DOM_el) {
    this.DOM.el = DOM_el;
    this.DOM.oddColumns = [...this.DOM.el.querySelectorAll(".column")].filter(
      (_, index) => index != 1
    );
    this.DOM.gridItems = [...this.DOM.el.querySelectorAll(".column__item")];
    this.DOM.gridItems.forEach((gridItem) => {
      const newItem = new GridItem(gridItem);
      this.gridItemArr.push(newItem);
      newItem.contentItem = new ContentItem(
        this.DOM.contentItems[newItem.position]
      );
    });
    this.initSmoothScroll();
    this.initEvents();
    this.trackVisibleItems();
  }
  initSmoothScroll() {
    this.lscroll = new LocomotiveScroll({
      el: this.DOM.el,
      smooth: true,
      lerp: 0.13,
      smartphone: {
        smooth: true,
      },
      tablet: {
        smooth: true,
      },
    });
    this.lscroll.on("scroll", (obj) => {
      this.lastscroll = obj.scroll.y;
      this.DOM.oddColumns.forEach(
        (column) => (column.style.transform = `translateY(${obj.scroll.y}px)`)
      );
    });
  }
  initEvents() {
    for (const [position, gridItem] of this.gridItemArr.entries()) {
      gridItem.DOM.img.outer.addEventListener("click", () => {
        if (
          !this.isGridView ||
          this.isAnimating ||
          document.documentElement.classList.contains("has-scroll-scrolling")
        ) {
          return false;
        }
        this.isAnimating = true;
        this.isGridView = false;
        this.currentGridItem = position;
        this.lscroll.destroy();
        this.showContent(gridItem);
      });
      gridItem.DOM.img.outer.addEventListener("mouseenter", () => {
        if (!this.isGridView || this.isAnimating) {
          return false;
        }
        gsap.killTweensOf([gridItem.DOM.img.outer, gridItem.DOM.img.inner]);
        gsap
          .timeline({
            defaults: {
              duration: 1.2,
              ease: "expo",
            },
            onComplete: () =>
              gsap.set([gridItem.DOM.img.outer, gridItem.DOM.img.inner], {
                willChange: "",
              }),
          })
          .addLabel("start", 0)
          .set(
            [gridItem.DOM.img.outer, gridItem.DOM.img.inner],
            {
              willChange: "transform",
            },
            "start"
          )
          .to(
            gridItem.DOM.img.outer,
            {
              scaleY: 0.9,
              scaleX: 0.9,
            },
            "start"
          )
          .to(
            gridItem.DOM.img.inner,
            {
              ease: "power4",
              scaleY: 1.2,
              scaleX: 1.2,
            },
            "start"
          );
      });
      gridItem.DOM.img.outer.addEventListener("mouseleave", () => {
        if (!this.isGridView || this.isAnimating) {
          return false;
        }
        gsap.killTweensOf([gridItem.DOM.img.outer, gridItem.DOM.img.inner]);
        gsap
          .timeline({
            defaults: {
              duration: 1.2,
              ease: "expo",
            },
            onComplete: () =>
              gsap.set([gridItem.DOM.img.outer, gridItem.DOM.img.inner], {
                willChange: "",
              }),
          })
          .addLabel("start", 0)
          .set(
            [gridItem.DOM.img.outer, gridItem.DOM.img.inner],
            {
              willChange: "transform",
            },
            "start"
          )
          .to(
            [gridItem.DOM.img.outer, gridItem.DOM.img.inner],
            {
              scale: 1,
            },
            0
          );
      });
    }
    window.addEventListener("resize", () => {
      if (this.isGridView) {
        return false;
      }
      const imageTransform = this.calcTransformImage();
      gsap.set(this.gridItemArr[this.currentGridItem].DOM.img.outer, {
        scale: imageTransform.scale,
        x: imageTransform.x,
        y: imageTransform.y,
      });
      for (const [
        position,
        viewportGridItem,
      ] of this.viewportGridItems.entries()) {
        const imgOuter = viewportGridItem.DOM.img.outer;
        gsap.set(viewportGridItem.DOM.img.outer, {
          scale: this.getFinalScaleValue(imgOuter),
          x: this.getFinalTranslationValue(imgOuter, position).x,
          y: this.getFinalTranslationValue(imgOuter, position).y,
        });
      }
    });
    this.DOM.backCtrl.addEventListener("click", () => {
      if (this.isGridView || this.isAnimating) {
        return false;
      }
      this.isAnimating = true;
      this.isGridView = true;
      this.initSmoothScroll();
      this.lscroll.scrollTo(this.lastscroll, {
        duration: 0,
        disableLerp: true,
      });
      this.closeContent();
    });
  }
  showContent(gridItem) {
    this.viewportGridItems = this.gridItemArr.filter(
      (el) => el != gridItem && el.DOM.el.classList.contains("in-view")
    );
    this.remainingGridItems = this.gridItemArr
      .filter((el) => !this.viewportGridItems.includes(el) && el != gridItem)
      .map((gridItem) => gridItem.DOM.el);
    this.viewportGridItemsImgOuter = this.viewportGridItems.map(
      (gridItem) => gridItem.DOM.img.outer
    );
    const imageTransform = this.calcTransformImage();
    gsap.killTweensOf([gridItem.DOM.img.outer, gridItem.DOM.img.inner]);
    this.timeline = gsap
      .timeline({
        defaults: {
          duration: 1.2,
          ease: "expo.inOut",
        },
        onStart: () => bodyEl.classList.add("oh"),
        onComplete: () => {
          gsap.set(this.remainingGridItems, {
            opacity: 0,
          });
          this.isAnimating = false;
        },
      })
      .addLabel("start", 0)
      .set(
        [gridItem.DOM.el, gridItem.DOM.el.parentNode.parentNode],
        {
          zIndex: 100,
        },
        "start"
      )
      .set(
        [
          gridItem.DOM.img.outer,
          gridItem.DOM.img.inner,
          this.viewportGridItemsImgOuter,
        ],
        {
          willChange: "transform, opacity",
        },
        "start"
      )
      .to(
        this.DOM.heading.top,
        {
          y: "-200%",
          scaleY: 4,
        },
        "start"
      )
      .to(
        this.DOM.heading.bottom,
        {
          y: "200%",
          scaleY: 4,
        },
        "start+=0.05"
      )
      .to(
        gridItem.DOM.img.outer,
        {
          scale: imageTransform.scale,
          x: imageTransform.x,
          y: imageTransform.y,
          onComplete: () =>
            gsap.set(gridItem.DOM.img.outer, {
              willChange: "",
            }),
        },
        "start"
      )
      .to(
        gridItem.DOM.img.inner,
        {
          scale: 1,
          onComplete: () =>
            gsap.set(gridItem.DOM.img.inner, {
              willChange: "",
            }),
        },
        "start"
      )
      .add(() => {
        gsap.set(this.DOM.contentNavItems, {
          y: `${gsap.utils.random(100, 300)}%`,
          opacity: 0,
        });
      }, "start");
    for (const [
      position,
      viewportGridItem,
    ] of this.viewportGridItems.entries()) {
      const imgOuter = viewportGridItem.DOM.img.outer;
      this.timeline
        .to(
          [viewportGridItem.DOM.caption, gridItem.DOM.caption],
          {
            ease: "expo",
            opacity: 0,
            delay: 0.03 * position,
          },
          "start"
        )
        .to(
          viewportGridItem.DOM.img.outer,
          {
            scale: this.getFinalScaleValue(imgOuter),
            x: this.getFinalTranslationValue(imgOuter, position).x,
            y: this.getFinalTranslationValue(imgOuter, position).y,
            onComplete: () =>
              gsap.set(imgOuter, {
                willChange: "",
              }),
            delay: 0.03 * position,
          },
          "start"
        );
    }
    this.timeline
      .addLabel("showContent", "start+=0.2")
      .to(
        [...this.DOM.contentNavItems].slice(this.viewportGridItems.length + 1),
        {
          y: "0%",
          opacity: 1,
          delay: (pos) => 0.03 * pos,
        },
        "showContent"
      )
      .add(() => {
        gridItem.contentItem.DOM.el.classList.add("content__item--current");
        bodyEl.classList.add("view-content");
      }, "showContent")
      .to(
        [this.DOM.backCtrl, this.DOM.contentNav, gridItem.contentItem.DOM.text],
        {
          opacity: 1,
        },
        "showContent"
      )
      .to(
        gridItem.contentItem.DOM.title,
        {
          opacity: 1,
          startAt: {
            y: "-100%",
            scaleY: 3,
          },
          y: "0%",
          scaleY: 1,
        },
        "showContent"
      );
  }
  closeContent() {
    const gridItem = this.gridItemArr[this.currentGridItem];
    gsap
      .timeline({
        defaults: {
          duration: 1.2,
          ease: "expo.inOut",
        },
        onStart: () => {
          gsap.set(this.remainingGridItems, {
            opacity: 1,
          });
          bodyEl.classList.remove("oh");
        },
        onComplete: () => {
          this.isAnimating = false;
        },
      })
      .addLabel("start", 0)
      .to(
        [this.DOM.backCtrl, this.DOM.contentNav, gridItem.contentItem.DOM.text],
        {
          opacity: 0,
        },
        "start"
      )
      .to(
        gridItem.contentItem.DOM.title,
        {
          opacity: 0,
          y: "-100%",
          scaleY: 3,
        },
        "start"
      )
      .to(
        [...this.DOM.contentNavItems].slice(this.viewportGridItems.length + 1),
        {
          y: `${gsap.utils.random(100, 300)}%`,
          opacity: 0,
          delay: (pos) => -0.03 * pos,
          onComplete: () => bodyEl.classList.remove("view-content"),
        },
        "start"
      )
      .add(() =>
        gridItem.contentItem.DOM.el.classList.remove("content__item--current")
      )
      .set(
        [gridItem.DOM.img.outer, this.viewportGridItemsImgOuter],
        {
          willChange: "transform, opacity",
        },
        "start"
      )
      .to(
        gridItem.DOM.img.outer,
        {
          scale: 1,
          x: 0,
          y: 0,
          onComplete: () => {
            gsap.set(gridItem.DOM.img.outer, {
              willChange: "",
            });
            gsap.set([gridItem.DOM.el, gridItem.DOM.el.parentNode.parentNode], {
              zIndex: 1,
            });
          },
        },
        "start"
      )
      .to(
        this.viewportGridItemsImgOuter,
        {
          scale: 1,
          x: 0,
          y: 0,
          stagger: (pos) => -0.03 * pos,
          onComplete: () => {
            gsap.set(this.viewportGridItemsImgOuter, {
              willChange: "",
            });
          },
        },
        "start"
      )
      .addLabel("showGrid", "start+=0.2")
      .to(
        [
          this.viewportGridItems.map((gridItem) => gridItem.DOM.caption),
          gridItem.DOM.caption,
        ],
        {
          ease: "power4.in",
          opacity: 1,
        },
        "showGrid"
      );
  }
  getFinalScaleValue(gridItemImageOuter) {
    return (
      this.DOM.contentNavItems[0].offsetHeight / gridItemImageOuter.offsetHeight
    );
  }
  getFinalTranslationValue(gridItemImageOuter, position) {
    const imgrect = adjustedBoundingRect(gridItemImageOuter);
    const navrect = adjustedBoundingRect(this.DOM.contentNavItems[position]);
    return {
      x: navrect.left + navrect.width / 2 - (imgrect.left + imgrect.width / 2),
      y: navrect.top + navrect.height / 2 - (imgrect.top + imgrect.height / 2),
    };
  }
  trackVisibleItems() {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0) {
          entry.target.classList.add("in-view");
        } else {
          entry.target.classList.remove("in-view");
        }
      });
    });
    this.DOM.gridItems.forEach((item) => observer.observe(item));
  }
  calcTransformImage() {
    const imgrect = adjustedBoundingRect(
      this.gridItemArr[this.currentGridItem].DOM.img.outer
    );
    return {
      scale: (winsize.height * 0.7) / imgrect.height,
      x: winsize.width * 0.5 - (imgrect.left + imgrect.width / 2),
      y: winsize.height * 0.5 - (imgrect.top + imgrect.height / 2),
    };
  }
}
