(function($, undefined) {
  App = {
    placeAnchorHooks : function() {
      $('[data-href]').live('touchstart',function() {
        App.Router.navigate( $(this).attr('data-href'), true );
        _.delay(function() { window.scrollTo(0,0); }, 250);
      });
    }
  };

  var Settings = Backbone.Model.extend({
    sync: function(method, model, options) {
      switch(method) {
        case 'create':
        case 'update':
          localStorage.setItem('Settings', JSON.stringify(model));
          break;
        case 'delete':
          localStorage.removeItem('Settings');
          break;
        case 'read':
          var settings = localStorage.getItem('Settings');
          model.attributes = (settings && JSON.parse(settings)) || {};
      }
      return this;
    }
  });

  var HomeView = Backbone.View.extend({
    el : $('#home'),
    initialize : function() {
      App.Settings.bind('change', this.showHideMenu, this);
      App.Settings.trigger('change');
    },
    
    showHideMenu : function() {
      if (!App.Settings.has('keywords') || App.Settings.get('keywords') === '') {
        this.el.find('menu').hide();
        this.el.find('#start-here').show();
      } else {
        this.el.find('#start-here').hide();        
        this.el.find('menu').show();
      }
    }
  });
  
  var SettingsView = Backbone.View.extend({
    el      : $('#settings'),
    events  : {
      'submit form' : 'save'
    },
    
    initialize : function() {
      if (App.Settings.has('keywords')) this.el.find('input').val(App.Settings.get('keywords'));
    },
    
    save : function(event) {
      event.preventDefault();
      var input = this.el.find(':text');
      App.Settings.save({ keywords: input.val() });
      input.blur();
    }
  });

  var Router = Backbone.Router.extend({
    routes : {
      ''            : 'home',
      '/'           : 'home',
      'shops/:id'   : 'show',
      '/shops/:id'  : 'show',      
      ':id'         : 'page',
      '/:id'        : 'page'
    },

    hideAll : function() {
      $('body > section').removeClass('current');
    },
    
    notFound: function() {
      $('#not-found').addClass('current');
    },

    home : function() {
      this.hideAll();
      $('#home').addClass('current');
    },

    page : function(id) {
      this.hideAll();
      $('#' + id).addClass('current');
    },

    show: function(id) {
      this.hideAll();
      var section = $('#shop-' + id);
      return section.length ? section.addClass('current') : this.notFound();
    }
  });


  $(document).ready(function() {
    App.Settings = new Settings;
    App.Settings.fetch();
    
    App.HomePage = new HomeView;
    App.SettingsView = new SettingsView;
    
    App.Router = new Router;
    Backbone.history.start({ pushState: true });
    
    App.placeAnchorHooks();

    setTimeout(function() { window.scrollTo(0, 0); }, 1000);
    $(window).bind('orientationchange', function() { scrollTo(0, 0); });
  });
})(jQuery);