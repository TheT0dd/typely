import {ItemView} from 'backbone.marionette';

const MediaView = ItemView.extend({

	className: 'post-section media-element',

	attributes: function() {
		return {
			name: this.getOption('name'),
			contenteditable: false
		};
	},

	initialize: function() {
		this.name = this.getOption('name');
	}
});

export default MediaView;