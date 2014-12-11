function ExternalTemplateSource(templateName, templateLocator, options)
{
    this.templateId = templateName;
    this.loaded = false;
    this.template = ko.observable();
    this.data = {};

    this.data = function(key, value) {
        if (arguments.length === 1) { return this.data[key]; }
        this.data[key] = value;
    };

    this.text = function(value) {
        if (!this.loaded) { this.getTemplate(); }
        if (arguments.length === 0) { return this.template(); }
        this.template(arguments[0]);
    };

    this.getTemplate = function() {
        var self = this;
        templateLocator
            .getTemplateHtml(templateName, options)
            .then(function(templateHtml) {
                self.template(templateHtml);
                self.loaded = true;
            })
            .catch(function(request, error){
                self.loaded = true;
                console.error(error);
                self.template("");
            });
    };
}

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
                else { reject(request, request.statusText); }
            };
            request.onerror = function(event) { reject(request, event.error); };
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

function ExternalTemplateEngine() {
    this.templates = {};
    this.templateLocator = new DefaultTemplateLocator();

    this.makeTemplateSource = function(template, bindingContext, options) {
        var self = this;

        if (typeof template == "string") {
            var elem = document.getElementById(template);
            if (elem) { return new ko.templateSources.domElement(elem); }

            if(!self.templates[template])
            { self.templates[template] = new ko.templateSources.externalTemplateSource(template, this.templateLocator, options); }

            return self.templates[template];
        }
        else if ((template.nodeType == 1) || (template.nodeType == 8))
        { return new ko.templateSources.anonymousTemplate(template); }
    }

    this.renderTemplate = function (template, bindingContext, options, templateDocument) {
        var templateSource = this.makeTemplateSource(template, templateDocument, options);
        return this.renderTemplateSource(templateSource, bindingContext, options, templateDocument);
    };
}

ko.templateSources.externalTemplateSource = ExternalTemplateSource;
ko.externalTemplateEngine = new ko.utils.extend(new ko.nativeTemplateEngine(), new ExternalTemplateEngine());
ko.setTemplateEngine(ko.externalTemplateEngine);