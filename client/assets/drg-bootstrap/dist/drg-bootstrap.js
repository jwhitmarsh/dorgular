$(document).ready(function () {

	// Remove icon for searchboxes
	$(".hasclear").keyup(function () {
		var t = $(this);
		t.next('span').toggle(Boolean(t.val()));
	});
	$(".clearer").hide($(this).prev('input').val());
	$(".clearer").click(function () {
		$(this).prev('input').val('').focus();
		$(this).hide();
	});


	// Two-tier navigation
	$('.parent-select li a').click(function (event) {
		var parentID = $(this).parent().parent().parent().attr('id');
		$('#' + parentID + '-selector li').removeClass('active');
		$(this).parent().addClass('active');
		if ($(this).parent().is(':first-child')) {
			$('#' + parentID + '-selections li').addClass('show');
		} else {
			var theID = $(this).parent().attr('id');
			$('#' + parentID + '-selections li').removeClass('show');
			$('#' + parentID + '-selections li.' + theID).addClass('show');
		}
		;
	});
	$('.dropdown-menu .parent-select li a').click(function (e) {
		e.preventDefault();
	});


	// Stops the dropdown box closing
	$('.dropdown-menu .checkbox, .dropdown-menu .searchbox, .dropdown-menu .parent-select').click(function (event) {
		event.stopPropagation();
	});


	// Select all checkboxes
	$('.checkbox-parent input').click(function (event) {
		var checkboxName = $(this).attr('name');
		if (this.checked) {
			$('input[name=' + checkboxName + ']').each(function () {
				this.checked = true;
			});
		} else {
			$('input[name=' + checkboxName + ']').each(function () {
				this.checked = false;
			});
		}
	});
	$(".checkbox input").click(function () {
		var checkboxName = $(this).attr('name');
		if (!$(this).is(':checked'))
			$('.checkbox-parent input[name=' + checkboxName + ']').prop('checked', false);
	});

	// STICKY PAGE TITLE
	if ($('#sticky-page-title').length > 0) {

		// Variables
		var titlePosition = $("#sticky-page-title").offset();
		var titleHeight = $("#sticky-page-title").outerHeight(true);
		var breadcrumbHeight = $(".breadcrumb").outerHeight(true);
		var titleHeightAffix = titleHeight - breadcrumbHeight;
		// Apply Affix
		$('#sticky-page-title').affix({
			offset: {
				top: titlePosition.top + breadcrumbHeight
			}
		});
		// On Affix, change styles
		$('#sticky-page-title').on('affix.bs.affix', function (e) {
			$('#content-container').css('margin-top', titleHeight + 'px');
			$('.breadcrumb').hide();
		});
		$('#sticky-page-title').on('affix-top.bs.affix', function (e) {
			$('#content-container').css('margin-top', '0px');
			$('.breadcrumb').show();
		});
	} else {
		// Variables
		var breadcrumbHeight = 0;
		var titleHeightAffix = 15;
	}
	if ($('#sticky-toc').length > 0) {
		// Variables
		var tocPosition = $("#sticky-toc").offset();
		var tocWidth = $("#sticky-toc").width();
		// Apply Affix
		$('#sticky-toc .toc').affix({
			offset: {
				top: tocPosition.top - titleHeightAffix + 15
			}
		});
		// On Affix, change styles
		$('#sticky-toc .toc').on('affix.bs.affix', function (e) {
			$(this).css('top', titleHeightAffix - 15 + 'px').css("width", tocWidth);
		});
		$('#sticky-toc .toc').on('affix-top.bs.affix', function (e) {
			$(this).css('top', '0px').css("width", 'auto');
		});
		// Jump Links	
		$("#sticky-toc ul li a[href^='#']").on('click', function (e) {
			e.preventDefault();
			var hash = this.hash;
			$('html, body').animate({
				scrollTop: $(this.hash).offset().top - titleHeightAffix
			}, 200, function () {
				window.location.hash = hash;
			});
		});
		// Scrollspy	
		$('body').scrollspy({
			target: '#sticky-toc .toc',
			offset: tocPosition.top - titleHeightAffix - 30
		})
	}
	// Back to Top	
	$("#BackToTop").on('click', function (e) {
		e.preventDefault();
		var hash = this.hash;
		$('html, body').animate({
			scrollTop: $(this.hash).offset().top
		}, 200);
	});
});