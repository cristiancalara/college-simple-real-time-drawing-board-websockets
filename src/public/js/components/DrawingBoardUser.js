(function ($, window, document, undefined) {
	'use strict';

	/**
	 *
	 * @constructor
	 */
	var DrawingBoardUser = function () {
		this.initialize();
	};

	/**
	 *
	 * @type {{constructor: DrawingBoardUser, initialize: initialize, bindUI: bindUI, serverInit: serverInit, subscribe: subscribe, emitDrawEvent: emitDrawEvent, drawLine: drawLine, canvasMouseDown: canvasMouseDown, canvasMouseMove: canvasMouseMove, canvasMouseRelease: canvasMouseRelease, standardizeEvent: standardizeEvent}}
	 */
	DrawingBoardUser.prototype = {
		constructor: DrawingBoardUser,

		initialize: function () {
			var $canvas = $('canvas');
			this.canvas = {
				$el: $canvas,
				context: $canvas[0].getContext("2d")
			};
			this.isMouseDown = false;
			this.lastEvent = null;

			// get from server a new color, that is not used.
			// subscribe to long polling event
			// send data when drawing.
			var self = this;
			this.serverInit(function (data) {
				self.color = data.color;

				self.subscribe();
				self.bindUI();
			});
		},
		bindUI: function () {
			// bind canvas events
			this.canvas.$el.on("mousedown touchstart", this.canvasMouseDown.bind(this))
				.on("mousemove touchmove", this.canvasMouseMove.bind(this))
				.on("mouseup touchend", this.canvasMouseRelease.bind(this))
				.on("mouseleave touchcancel", this.canvasMouseRelease.bind(this));
		},
		/**
		 * Initialize and get a unique color.
		 * @param callback
		 */
		serverInit: function (callback) {
			$.ajax({
				type: 'GET',
				url: '/initialize',
				success: function (data) {
					callback(data);
				}
			});
		},
		/**
		 * Create the long polling request.
		 */
		subscribe: function () {
			var self = this;
			this.ws = new WebSocket('ws://127.0.0.1:5000');
			this.ws.onmessage = function (message) {
				var line = JSON.parse(message.data);
				self.drawLine(line);
			};
		},

		/**
		 * Send draw line event
		 * @param line
		 */
		emitDrawEvent: function (line) {
			this.ws.send(JSON.stringify(line));
		},

		/**
		 * Draw the line on the canvas.
		 * @param line
		 */
		drawLine: function (line) {
			this.canvas.context.beginPath();
			this.canvas.context.moveTo(line.start.x, line.start.y);
			this.canvas.context.lineTo(line.end.x, line.end.y);
			this.canvas.context.lineWidth = 3;
			this.canvas.context.strokeStyle = line.color;
			this.canvas.context.stroke();
		},


		canvasMouseDown: function (e) {
			e.preventDefault();
			this.lastEvent = this.standardizeEvent(e);
			this.isMouseDown = true;
		},

		canvasMouseMove: function (e) {
			e.preventDefault();
			var event = this.standardizeEvent(e);
			if (this.isMouseDown) {
				var line = {
					start: {x: this.lastEvent.offsetX, y: this.lastEvent.offsetY},
					end: {x: event.offsetX, y: event.offsetY},
					color: this.color
				};

				this.drawLine(line);

				// trigger server event.
				this.emitDrawEvent(line);

				//socket.emit(lineEmit, line);
				this.lastEvent = this.standardizeEvent(e);
			}
		},

		canvasMouseRelease: function () {
			this.isMouseDown = false;
		},

		/**
		 * Standardize event for touch and non touch
		 * @param e
		 * @returns {*}
		 */
		standardizeEvent: function (e) {
			if (/^touch/.test(e.type) && e.originalEvent.touches.length == 1) {
				var touchEvent = e.originalEvent.touches[0];
				e = {pageX: touchEvent.pageX, pageY: touchEvent.pageY}
			}
			return (typeof(e.offsetX) === 'undefined') ?
				{offsetX: e.pageX - this.canvas.$el.offset().left, offsetY: e.pageY - this.canvas.$el.offset().top} :
				{offsetX: e.offsetX, offsetY: e.offsetY};
		}
	};

	window.DrawingBoardUser = DrawingBoardUser;
})(jQuery, window, document);