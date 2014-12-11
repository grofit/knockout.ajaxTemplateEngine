# Knockout.externalTemplateEngine

A bare bones implementation to allow requesting of templates via ajax.

There are far better libraries than this one if you have a simple use case of just reading of external templates, such as this:
https://github.com/ifandelse/Knockout.js-External-Template-Engine

This was created as on a project there is a scenario for loading templates from multiple sources and some were dynamic, which
is possible with the other libraries, I just wanted a bit more control over how I read and routed the templates.

## Usage

Not much difference to normal really, you set your template binding and if it is not in a script tag in the page it will look
in a default folder `/templates` and if it exists there with the convention `*.template.html`, this is totally configurable though
and we will get onto that in a bit.
```
<div data-bind="template: 'some-template-name'"></div>
```

The engine wraps the existing `nativeTemplateEngine` so really all we do here is proxy the template fetching mechanism.

## Customisation

So the normal customisation of your template exists as per the knockout template binding however there is the option
to customize how templates are located and loaded, the engine uses a default template loader class which can be
entirely replaced, but the default will let you set your template directory/suffix should be globally:

```
// Include knockout and knockout.externalTemplateEngine
ko.externalTemplateEngine.templateLocator.defaultTemplateLocation = "external-templates";
ko.externalTemplateEngine.templateLocator.defaultTemplateSuffix = ".template.html";
```

Or set them for each template:

```
<div data-bind="template: { name: 'some-template-name', location: 'custom-module/templates', suffix: '.html' }"></div>
```

However you can also replace the entire default loader if you want, if you look in the source code there is a default loader,
which currently (may change in newer versions) looks like:

```
function DefaultTemplateLocator() {
    this.defaultTemplateLocation = "templates";
    this.defaultTemplateSuffix = ".template.html";

    var makeGetRequest = function(url) {
        return new Promise(function(resolve, reject)
        {
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.onload = function() {
                if(request.status == 200) { resolve(request.responseText); }
                else { reject(request, request.responseText); }
            };
            request.onerror = function(error) { reject(request, error); };
            request.send();
        });
    };

    this.locateTemplate = function(templateName, options) {
        var templateLocation = options.location || this.defaultTemplateLocation;
        var templateSuffix = options.suffix || this.defaultTemplateSuffix;
        return templateLocation + "/" + templateName + templateSuffix;
    };

    this.getTemplateHtml = function(templateName, options) {
        var url = this.locateTemplate(templateName, options);
        return makeGetRequest(url);
    }
}
```

Now you can create your own if you wanted to, make it load via module loaders, make it use jquery ajax, or just extend
it and override the `locateTemplate` and/or `getTemplateHtml` methods. The you will be provided the `templateName` and
the `options` which are used in the template binding, so you can add custom variables to your bindings and process
them accordingly. The `getTemplateHtml` returns a promise object which is supported in most modern browsers other than
IE, however you can easily polyfill this if you google for `Promise IE Polyfill`, here are some commonly used ones:

https://github.com/jakearchibald/es6-promise

https://github.com/taylorhakes/promise-polyfill

If you do need to make your own implementation of the above object then you should be able to replace the default one
with it like so:

```
ko.externalTemplateEngine.templateLocator = new MyTemplateLocator();
```

Not much more too it really...

Here is an example of what it does and how to use it.
[View Example](https://rawgithub.com/grofit/knockout.externalTemplateEngine/master/example/index.html)