<figure>
	<img src="<%= src %>" id="<%= id %>" data-type="<%= type %>">
	<figcaption
		class="caption editable"
		contenteditable="true"
		data-caption-placeholder="<%= captionPlaceholder %>">
		<%= caption || captionPlaceholder %>
	</figcaption>
</figure>
