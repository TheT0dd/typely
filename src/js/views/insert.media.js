import $ from 'jquery';
import {Model} from 'backbone';
import {ItemView} from 'backbone.marionette';
import insertMediaTpl from './templates/insert.media';
import ImageView from 'views/media.image';
import Cocktail from 'backbone.cocktail';
import ClickoutMixin from 'mixins/clickout.mixin';
import {requestFileInput} from 'common/file.input';
import {notify} from 'common/notify';
import {generateSectionUID, generateImageUID} from 'common/uid';
import {isImage} from 'common/validators';
import {readAsDataUrl} from 'common/image.reader';

// TODO: when content height changes, instead of triggering
//       `postHeightChanged`, just call positionSelf()


const InsertMediaView = ItemView.extend({
	template: insertMediaTpl,

	className: 'typely-insert-media',

	ui: {
		showTooltipButton: '.show-tooltip-button',
		tooltip: '.tooltip',
		tooltipList: '.tooltip .tooltip-list',
		tooltipListItem: '.tooltip .tooltip-list li',
		mediaType: '[data-media-type]',
		fileInput: 'input[type="file"]'
	},

	events: {
		'mouseup @ui.showTooltipButton': 'killEvent',
		'mousedown @ui.showTooltipButton': 'handleTooltipButtonClick',
		'mouseup @ui.mediaType': 'killEvent',
		'mousedown @ui.mediaType': 'handleMediaTypeClick'
	},

	initialize: function() {
		this.maxFileSize = this.getOption('maxFileSize');
		this.contentEl = this.getOption('contentEl');
	},

	onRender: function() {
		this.triggerMethod('hide');
	},

	onAttach: function() {
		this.saveSiblingRefsToDOM();
		this.setTooltipWidth();
	},

	onClickOut: function() {
		this.triggerMethod('hide:tooltip');
	},

	onHookDetached: function() {
		this.triggerMethod('hide');
	},

	onReveal: function() {
		this.$el.removeClass('hidden');
	},

	onHide: function() {
		this.$el.addClass('hidden');
	},

	onShowTooltip: function() {
		if (this.ui.tooltip.hasClass('hidden')) {
			this.ui.tooltip.removeClass('hidden');
			this.triggerMethod('media:tooltip:shown');
		}
	},

	onHideTooltip: function() {
		if (!this.ui.tooltip.hasClass('hidden')) {
			this.ui.tooltip.addClass('hidden');
			this.triggerMethod('media:tooltip:hidden');
		}
	},

	onToggleTooltip: function() {
		this.ui.tooltip.toggleClass('hidden');
		if (this.ui.tooltip.hasClass('hidden')) {
			this.triggerMethod('media:tooltip:hidden');
		} else {
			this.triggerMethod('media:tooltip:shown');
		}
	},

	onShowAfterHook: function(hookEl) {
		this.hookEl = hookEl;
		this.prevElName = this.hookEl.attr('name');
		this.nextElName = this.hookEl.next(':not(.non-section)').length > 0 ?
			this.hookEl.next().attr('name') : -1;

		this.positionSelf(hookEl, this.contentEl);
		this.triggerMethod('reveal');
	},

	onUpdatePosition: function() {
		this.positionSelf(this.hookEl, this.contentEl);
	},

	positionSelf: function(hookEl, parentEl) {
		if (!hookEl || !$.contains(document, hookEl[0])) {
		    this.triggerMethod('hook:detached');
			return;
		}

		const hookPosition = hookEl.position();
		const parentElPosition = parentEl.position();

		const left = 0;

		let top = parentElPosition.top +
			hookPosition.top +
			hookEl.outerHeight(true) -
			parseInt(hookEl.css('margin-bottom'));

		// minor alignment corrections
		if(hookEl[0].nodeName === 'H1') {
			// top -= 7;
		}
		else if(hookEl[0].nodeName === 'BLOCKQUOTE') {
			top += 7;
		}
		else {
			top += 3;
		}

		this.$el.css({
			left: left + 'px',
			top: top + 'px'
		});
	},

	saveSiblingRefsToDOM: function() {
		this.$el.attr('data-ref-prev', this.prevElName);
		this.$el.attr('data-ref-next', this.nextElName);
	},

	handleTooltipButtonClick: function(e) {
		this.killEvent(e);
		this.triggerMethod('toggle:tooltip');
		return false;
	},

	killEvent: function(e) {
		e.preventDefault();
		e.stopPropagation();
	},

	setTooltipWidth: function() {
		const itemWidth = this.ui.tooltipListItem.width();
		const itemCount = this.ui.tooltipListItem.length;
		// this.ui.tooltip.width(itemWidth * itemCount);
		this.ui.tooltipList.width(itemWidth * itemCount);
	},

	handleMediaTypeClick: function(e) {
		this.killEvent(e);
		const type = $(e.currentTarget).attr('data-media-type');
		// handle single image input ourselves
		if (type === 'image') {
			this.handleSingleImageInput();
		}
		// notify parent (editor view) to handle all other media input
		else {
			this.triggerMethod('hide:tooltip');
			this.triggerMethod('request:media:input', type, this.hookEl);
		}
	},

	handleSingleImageInput: function() {
		requestFileInput().then((file) => {
			// validate image type
			if (!isImage(file)) {
				notify({
					type: 'warn',
					title: 'Invalid Image',
					body: `Image type: ${file.type} is invalid. Only jpg, png and gif are accepted`
				});
				return;
			}
			// make sure selected file size does not exceed threshold
			if (file.size > this.maxFileSize) {
				notify({
					type: 'warn',
					title: 'Image Size Error',
					body: `Image size should not exceed ${this.maxFileSize}`
				});
				return false;
			}
			this.displaySingleImage({
				file: file,
				hookEl: this.hookEl
			});
		});
	},

	displaySingleImage: function({file, hookEl}) {

		readAsDataUrl(file).then((result) => {
			const img = new Image();
			img.onload = () => {
				// prepare view
				const imageView = new ImageView({
					model: new Model({
						src: img.src,
						id: generateImageUID(),
						type: file.type,
						captionPlaceholder: 'Click to enter a caption'
					}),
					name: generateSectionUID()
				});
				// render it
				imageView.render();
				// insert view $el after hookEl
				hookEl.after(imageView.$el);
				// trigger event (to notify the editor parent view)
				this.triggerMethod('inserted:media', {
					mediaView: imageView,
					hookEl: hookEl
				});
				// hide tooltip
				this.triggerMethod('hide:tooltip');
			};
			// will force the browser to load image & when done will fire 'load' on image
			img.src = result;
		});
	},


});

Cocktail.mixin(InsertMediaView, ClickoutMixin);

export default InsertMediaView;
