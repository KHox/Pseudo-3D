import { FrameRenderableComponent } from "../../FrameSystem/index.js";
import { isNumeric, Transform } from "../../Lib/index.js";

export class DrawingMapSystem extends FrameRenderableComponent {
    constructor() {
        super();
        this._dmsCanvas = document.createElement('canvas');
        this._dmsCtx = this._dmsCanvas.getContext('2d');

        this._cameraTransform = new Transform();
    }

    get cameraTransform() {
        return this._cameraTransform;
    }
    
    onOpen() {
        this._ctx = this._frame.ctx;
        
        this._centerX = this._frame.width / 2;
        this._centerY = this._frame.height / 2;

        /**
         * @type {Array<Object2D>}
         */
        this._objects = Array.from(this.children).filter(c => c instanceof Object2D);
    }

    postRender() {
        this._objects.forEach(o2d => this.drawObject2d(o2d));
    }

    /**
     * @param {Object2D} o2d 
     */
    drawObject2d(o2d) {
        let w, h, image;

        if (o2d.outline.color) {
            let offW = o2d.outline.width;
            let offH = o2d.outline.height;

            w = o2d.width + offW * 2;
            h = o2d.height + offH * 2;

            this._dmsCanvas.width = w;
            this._dmsCanvas.height = h;

            this._dmsCtx.fillStyle = o2d.outline.color;
            this._dmsCtx.fillRect(0, 0, w, h);

            this._dmsCtx.globalCompositeOperation = 'destination-in';

            this._dmsCtx.drawImage(o2d.image, 0, 0, w, h);

            this._dmsCtx.globalCompositeOperation = 'source-over';

            this._dmsCtx.drawImage(o2d.image, offW, offH, o2d.width, o2d.height);

            image = this._dmsCanvas;
        } else {
            w = o2d.width;
            h = o2d.height;
            image = o2d.image;
        }

        let x = this._centerX + o2d.transform.position.x - this._cameraTransform.position.x;
        let y = this._centerY + o2d.transform.position.y - this._cameraTransform.position.y;

        this._ctx.save();

        this._ctx.translate(x, y);
        this._ctx.rotate(o2d.transform.rotation - this._cameraTransform.rotation);
        this._ctx.translate(-w / 2, -h / 2);

        this._ctx.drawImage(image, 0, 0, w, h);

        this._ctx.restore();
    }

    getObjectsByName(name) {
        return this._objects.filter(o => o.name == name);
    }

    onResize() {
        this._centerX = this._frame.width / 2;
        this._centerY = this._frame.height / 2;
    }
}

customElements.define('drawing-map-system', DrawingMapSystem);

export class Object2D extends HTMLElement {
    constructor(src) {
        super();
        this._name = 'Unknown object';
        this._height = this._width = null;
        this._loads = [];

        this._image = new Image();
        this._image.onload = () => {
            if (this._width == null) {
                this._width = this._image.width;
            }
            
            if (this._height == null) {
                this._height = this._image.height;
            }

            this._loads.forEach(f => f(this));
        }

        if (src) {
            this._image.src = src;
        }

        this._outline = {
            color: '',
            width: 5,
            height: 5
        };
        
        this._transform = new Transform();
    }

    get transform() {
        return this._transform;
    }

    set transform(v) {
        this._transform.set(...v.valueOf());
    }

    get width() {
        return this._width;
    }

    set width(v) {
        if (isNumeric(v)) {
            this._width = v;
        }
    }

    get height() {
        return this._height;
    }

    set height(v) {
        if (isNumeric(v)) {
            this._height = v;
        }
    }

    get outline() {
        return this._outline;
    }

    get image() {
        return this._image;
    }

    get src() {
        return this._image.src;
    }

    set src(v) {
        this._image.src = v;
    }

    set onload(func) {
        if (func instanceof Function) {
            this._loads.push(func);
        }
    }

    get name() {
        return this._name;
    }

    static get observedAttributes() {
        return ['src', 'x', 'y', 'rot', 'width', 'height', 'outline-color', 'outline-width', 'outline-height', 'name'];
    }
    
    attributeChangedCallback(name, _, newValue) {
        switch (name) {
            case 'src':
                this._image.src = newValue;
                break;
            case 'x':
                this._transform.position.x = +newValue;
                break;
            case 'y':
                this._transform.position.y = +newValue;
                break;
            case 'rot':
                this._transform.rotation = +newValue;
                break;
            case 'width':
                this.width = +newValue;
                break;
            case 'height':
                this.height = +newValue;
                break;
            case 'outline-color':
                this._outline.color = newValue;
                break;
            case 'outline-width':
                this._outline.width = +newValue;
                break;
            case 'outline-height':
                this._outline.height = +newValue;
                break;
            case 'name':
                this._name = newValue;
                break;
        }
    }
}

customElements.define('object-2d', Object2D);