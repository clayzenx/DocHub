export default {
	data: () => ({
		zoomAndPan: {
			zoomKeys: ['ctrlKey', 'shiftKey'],  // Кнопка для зума
			panKeys: ['ctrlKey', 'shiftKey'],
			isMove: false, 			 // Признак перемещения схемы
			cacheViewBox: null,
      originalHeight: 500,
      isFullScreenMode: false,
      isNeedResize: false,
			moveX: 0,
			moveY: 0,
			zoom: {
				value: 1,   // Текущий зум
				step: 0.1  	// Шаг зума
			}
		}
	}),
  watch: {
    '$store.state.isFullScreenDiagram'(value) {
      console.log('v', value);
      if(!value) {
        this.changePanHeight(this.zoomAndPan.originalHeight);
        return;
      }
      this.zoomAndPan.isNeedResize = value;
      this.zoomAndPan.isFullScreenMode = value;
      // Do something with the new value
    },
  },
  mounted() {
    if(
      this.$route.name == 'entities'
      && this.$store.state.isFullScreenDiagram
    ) {
        this.zoomAndPan.isFullScreenMode = true;
        this.zoomAndPan.isNeedResize = true;
        window.addEventListener('resize', () => this.zoomAndPan.isNeedResize = true);
    }
  },
	computed: {
		koofScreenX() {
			return this.zoomAndPanElement ? this.ZoomAndPanViewBox.width / this.zoomAndPanElement.clientWidth : 1;
		},
		// Коэффициент преобразования реальных точек во внутренние по высоте
		koofScreenY() {
			return this.zoomAndPanElement ? this.ZoomAndPanViewBox.height / this.zoomAndPanElement.clientHeight : 1;
		},
		ZoomAndPanViewBox() {
			if (!this.zoomAndPanElement) {
				return {
					x: 0,
					y : 0,
					width : 0,
					height : 0
				};
			} else
				return this.zoomAndPan.cacheViewBox ?
					this.zoomAndPan.cacheViewBox
					// eslint-disable-next-line vue/no-side-effects-in-computed-properties
					: this.zoomAndPan.cacheViewBox = this.zoomAndPanElement.viewBox.baseVal;
		},
		zoomAndPanElement() {
			return this.$refs.zoomAndPan;
		}
	},
	methods: {
		doZoom(value, x, y) {
			const kX = x / (this.zoomAndPanElement.clientWidth || x);
			const kY = y / (this.zoomAndPanElement.clientHeight || y);
			let resizeWidth = value * this.ZoomAndPanViewBox.width;
			let resizeHeight = value * this.ZoomAndPanViewBox.height;
			this.ZoomAndPanViewBox.x -= resizeWidth * kX;
			this.ZoomAndPanViewBox.width += resizeWidth;
			this.ZoomAndPanViewBox.y -= resizeHeight * kY;
			this.ZoomAndPanViewBox.height += resizeHeight;
			this.zoomAndPan.cacheViewBox = null;
		},
		isPushKey(event, keys) {
			for (let i = 0; i < keys.length; i++) {
				if (event[keys[i]]) return true;
			}
			return false;
		},
		zoomAndPanWheelHandler(event) {
			if (!this.isPushKey(event, this.zoomAndPan.zoomKeys)) return;
			let e = window.event || event;
			switch (Math.max(-1, Math.min(1, (e.deltaY || -e.detail)))) {
				case 1:
					this.doZoom(this.zoomAndPan.zoom.step, event.offsetX, event.offsetY);
					break;
				case -1:
					this.doZoom(-this.zoomAndPan.zoom.step, event.offsetX, event.offsetY);
					break;
			}
			event.stopPropagation();
		},
		zoomAndPanMouseDown(event) {
			if (!this.isPushKey(event, this.zoomAndPan.panKeys)) return;
      if(
        this.zoomAndPan.isNeedResize
        && this.zoomAndPan.isFullScreenMode
      ) {
        this.zoomAndPan.originalHeight = this.zoomAndPanElement.clientHeight;
        this.changePanHeight(window.innerHeight);
        this.restoreOriginalZoom();
        this.zoomAndPan.isNeedResize = false;
      }
			this.zoomAndPan.isMove = true;
			this.zoomAndPan.moveX = event.clientX;
			this.zoomAndPan.moveY = event.clientY;
		},
		zoomAndPanMouseMove(event) {
			if (!this.zoomAndPan.isMove) return;
			this.ZoomAndPanViewBox.x += (this.zoomAndPan.moveX - event.clientX) * (this.koofScreenX || 0);
			this.ZoomAndPanViewBox.y += (this.zoomAndPan.moveY - event.clientY) * (this.koofScreenY || 0);
			this.zoomAndPan.moveX = event.clientX;
			this.zoomAndPan.moveY = event.clientY;
		},
		zoomAndPanMouseUp() {
			this.zoomAndPan.isMove = false;
		},
    changePanHeight(height) {
      const currentHeight = this.zoomAndPanElement.clientHeight;
      if(
        currentHeight > height
        && height != this.zoomAndPan.originalHeight
      ) return;
      const heightIncreaseRatio = height / currentHeight;

      this.zoomAndPanElement.style.height = height + 'px';

      const currentWidth = this.zoomAndPanElement.clientWidth;
      const newWidth = currentWidth * heightIncreaseRatio;
      this.zoomAndPanElement.style.width = newWidth + 'px';
    },
    restoreOriginalZoom() {
      const originalHeight = this.zoomAndPan.originalHeight;
      const currentHeight = parseInt(this.zoomAndPanElement.style.height);
      const heightDecreaseRatio = originalHeight / currentHeight;

      const newZoom = this.zoomAndPan.zoom.value / heightDecreaseRatio - this.zoomAndPan.zoom.value;

      this.doZoom(newZoom, this.zoomAndPanElement.clientWidth / 2, this.zoomAndPanElement.clientHeight / 2);
    }
	}
};
