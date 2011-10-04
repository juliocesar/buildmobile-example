# Modern mobile web development

## Intro

Let's make a collective decision here. We'll stop treating A-grade mobile phones as aliens, and see them for what they are: powerful, capable devices, running powerful rendering engines.

Throwing a framework at your app, such as jQuery Mobile, Sencha, or anything that gives you the popular iOS-like native look and feel, instantly boxes you into a set of choices, design and functionality-wise. Your app becomes a McDonalds burger: same as a bunch of other B-side apps that look and feel slightly worse than a native application. You can do way better than that, using what the browser in each of these devices provides.

We'll look at how to do this, taking a minimalist approach using HTML5, CSS3 and [Backbone.js](http://documentcloud.github.com/backbone/). Minimalism is now trendy (your mileage may vary) for desktop web apps, but on mobile, the benefits are huge, and more importantly, noticeable.

Point your iPhone/Android to [http://awesomebydesign.com/bm-example](http://awesomebydesign.com/bm-example) and have a play around. This example is taken from an app I've been working on, *very* slowly, for a while now. The implementation is, in turn, based on an example that comes with [Zepto.js](https://github.com/madrobby/zepto/tree/master/examples/iphone).

## First things first

Let's understand the markup first. Each "page" in our app is defined by a `<section>` tag. Navigation will consist of us jumping from one section to another, so at any one time there's only one section visible, which is how nearly every mobile web framework works in reality, though the way we're doing it is quite minimal and semantic.

    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <section id="home"></section>
        <section id="settings"></section>
        <section id="shop-1"></section>
      </body>
    </html>

Here's the part of the CSS that handles the navigation. I've omitted the aesthetic parts to keep the discussion focussed, but you can see it whole on GitHub.

    * { margin: 0; padding: 0; outline: 0; -webkit-box-sizing: border-box }

    body {
      position: absolute;
      height: 100%;
      width: 100%;
      overflow-x: hidden;
      -webkit-perspective: 800;
      -webkit-text-size-adjust: none;
      -webkit-transform-style: preserve-3d;
      -webkit-user-select: none;
    }

    body > section {
      position: absolute;
      left: 0;
      width: 100%;
      opacity: 0;
      -webkit-transition: all 0.25s ease-in-out;
      -webkit-transform-style: preserve-3d;
      -webkit-transform: translate3d(100%,0%,0%);
    }

    body > section.current { -webkit-transform: translate3d(0%,0%, 0%); opacity: 1 }

The above says, roughly:

  * On every element, Reset the margin, padding, and outline to zero. Also, let the element's width to be defined by where the border is, instead of it's contents. This last setting is particularly handy in the context of mobile because there'll be a lot of elements allowed to freely flow to the maximum width of the screen. If we added padding to any of those and left this out, overflow would occur.
  * Stretch the body to the maximum width, and every immediate child section along.
  * By default, every section is hidden. Only a section containing the class `current` will be visible.
  * We want to allow vertical scrolling while keeping horizontal scrolling out.
  * A transition should occur on every transitionable attribute. That's gonna help us creating a cool transition effect between pages.

Sounds kind of crazy, but that's really all there is to our application as far as structuring it's sections goes.

But until we can press buttons and go from one place to another, we don't have much. So let's get that going with a Backbone Router and some pushState action.

    var Router = Backbone.Router.extend({
      routes : {
        ''            : 'home',
        '/'           : 'home',
        '/shops/:id'  : 'shop',
        '/:id'        : 'page'
      },
  
      hideAll : function() {
        $('body > section').removeClass('current');
      },
  
      home : function() {
        this.hideAll();
        $('#home').addClass('current');
      },
  
      page : function(id) {
        this.hideAll();
        $('#' + id).addClass('current');
      }
    });
    App.placeAnchorHooks();
    Backbone.history.start({ pushState: true });    

I said earlier that one section would be visible at any one time. That's achieved by having the CSS class `current` set in the visible section. Since by default every section is hidden, as per the CSS we wrote earlier, everything other section will remain hidden. The `hideAll` method removes the class from whatever section that has it, so it's called first thing before any other section is assigned it.

We defined a route for the home page, which is the first thing you'll see when you get to the app, a route for matching shops we'll browse, and a catch-all route which will kick in when we specify anything else.

Note that should this be a brochure kind of app (just separate sections and navigation), we wouldn't need anything else from Backbone other than a router. That's one big up for the spirit of minimalism behind this framework. You can use the parts that you want, while leaving the others out.

## Linking 

Since we're using [pushState](http://diveintohtml5.org/history.html), we're technically not talking about links in the traditional sense. They're not anchors, which use the `href` attribute to get the browser to make a new request. pushState is something else: you're relying on JavaScript to manipulate the browser history by pushing URLs into it. Backbone, in turn, detects these changes and sends you to a "route" that matches the URL being pushed.

To make it clear: forget real anchors. Unless you're concerned with making the app degrade to browsers that don't support pushState of JavaScript even, depending on the semantics of your markup, you may as well do away with them.

As of the time of this writing, there are issues with how iOS handles real anchors, events being interrupted, and pushState, so for the sake of making things simple, I've devised a workaround: I'll rely on an HTML5 attribute named `data-href`, then run a jQuery `live` call on every anchor or button that has it set, and hook a call to the router's `navigate` on `touchstart`. It's an earful, but the implementation is rather simple:

    placeAnchorHooks : function() {
      $('[data-href]').live('touchstart', function() {
        App.Router.navigate( $(this).attr('data-href'), true );        
      });
    }

Using `touchstart` instead of `click` makes a huge difference to the responsiveness of the app. As an exercise, replace it with `click` (you'll have to clone the repository first) to see what happens. You'll notice that for every tap, there's a perceptible delay before the screen reacts to the touch. By using `touchstart` instead of `click`, we're working around that.

In case you're wondering, yes, we could do without pushState and rely instead on hashbangs to get things going. I'm doing this to illustrate how easy it is to have transparent pushState-enabled links in your app. This can be reused with non-mobile web apps too.

## Settings

We're allowing only one setting in this example. The user may specify keywords that the app will use to narrow down which stores it should show. This, however, can easily be extended to a number of attributes. Of particular note here, is how we're keeping these preferences. I've overridden the `sync` method for the `Settings` Backbone model, so that it saves the attributes using [localStorage](http://diveintohtml5.org/storage.html). This makes perfect sense when you realise we're keeping preferences on a per-device basis. And until it becomes the norm for people to carry more than one mobile phone, that will do.

The override consists of:

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
            model.attributes = (settings && JSON.parse(settings) || {});
            return model;
        }   
        return this;
      }

## Views are sub-applications

This example uses two [Backbone Views](http://documentcloud.github.com/backbone/#View): one for the home page, and one for the settings page. I won't go into detail as to what Backbone views are, but think of them as self-contained sub-applications inside your big application. The `HomeView` class has a base element, and all the visual stuff that's related to it happens in this element. It also keeps an eye out for changes in the `Settings` model with this line:

    App.Settings.bind('change', this.hideMenu, this);
    
That's so we stop pesking the user with that bouncing exclamation mark once they've set some keywords.

The `SettingsView` class in turn has two jobs. First, take what's already in the `Settings` model (say, you've set your keywords before) and populate the text field with it, so the user can see what's in there. Second, grab what's in the text field and put it in the `Settings` model when we change the value by submitting the form.

## Custom pages

It'd be interesting to allow shop owners to customise the look of their mobile store. But only to an extent, because we don't want to inflict another MySpace on the world. So we'll allow them to pick themes, which consist of a few overrides that kick in through a CSS class. This is really easy to do, fortunately.

    body > section.coffee {
      background: -webkit-gradient(radial, 50% center, 200, 50% center, 40, from(#a54e03), to(#bc7940)), #a54e03;
    }
    body > section.coffee h1,
    body > section.coffee p   { text-shadow: 1px 1px 0 #000 }

The “coffee” theme is merely a variant of the original red theme, with a coffee-like colour. As a bonus I've added drop shadows to the text to improve the readability, since the light brown colour offers a lot less contrast than the original dark red, when considering the white text.

So let’s say the store owner, when setting up her store, picked the “coffee" theme. In the example, we have a few hardcoded links in the HTML, and one working store with little content in it. If we were loading these from a server via Ajax, we'd load the store's preferences, detect the theme choice, and apply the corresponding CSS class to the `<section>` element.
  
In a nutshell, this is a recipe for customising pages in our little framework of sorts.

## Rationale

You may be wondering why you'd go through all this when throwing a framework at it sounds so much simpler and quicker. The idea here is twofold: to have you understand that building this from scratch is _very_ straightforward, and to give you a base boilerplate that you can keep around, so you can always start a new app from it.

You could either macro the contents of these files into your text editor, or write a script and create a mini-toolchain, or even manually copy this boilerplate to a new folder. Once you get that going, you'll boot a new application as fast as you'd do with any other framework.

## Performance

Some of you will notice that the JavaScripts are uncompressed, and each separated into it's own file. Keeping that in production is a terrible idea, especially if we're talking about mobile applications where latency is so much more expensive. Should you deploy this as an application, make sure you minify and bundle your scripts, as this will make things significantly faster.

Another important consideration, along the same lines of minimising the number of HTTP requests a mobile browser needs to make to load your app, is making sure that the images that are part of the application, like for example arrows for buttons, the application logo, and so on, are either:

* Embedded in the CSS using [Data URI](http://en.wikipedia.org/wiki/Data_URI_scheme). This will increase the size of the image a little, but you still stand to gain from it. The less HTTP requests your app needs to make, the faster it'll be.
* Converted into SVG and embedded in the HTML. That's a personal favourite of mine. iOS 4 and 5, and Android Honeycomb all support SVG, so to stay on the safe side, if you expect you'd have to support browsers that don't support SVG, go with the previous option.

## Parting words

At the risk of sparking rants, let me clarify one thing: there's nothing *essentially* wrong with mobile frameworks. Well, some of them are very bad, but in general most of them offer support for old, featureless mobile browsers. Should you need to support those, then by all means, give a framework a shot, as it certainly will save you time.

If, however, you are looking at having your application running on either Android or iOS, embrace the constraints. There are few constraints, and they are mostly design-centric, so roll your own framework using a minimalist targeted approach.