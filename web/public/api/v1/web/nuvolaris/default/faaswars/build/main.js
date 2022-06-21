
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z = "/*! normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css */\n\n/* Document\n   ========================================================================== */\n\n/**\n * 1. Correct the line height in all browsers.\n * 2. Prevent adjustments of font size after orientation changes in iOS.\n */\n\nhtml {\n  line-height: 1.15; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n}\n\n/* Sections\n   ========================================================================== */\n\n/**\n * Remove the margin in all browsers.\n */\n\nbody {\n  margin: 0;\n}\n\n/**\n * Render the `main` element consistently in IE.\n */\n\nmain {\n  display: block;\n}\n\n/**\n * Correct the font size and margin on `h1` elements within `section` and\n * `article` contexts in Chrome, Firefox, and Safari.\n */\n\nh1 {\n  font-size: 2em;\n  margin: 0.67em 0;\n}\n\n/* Grouping content\n   ========================================================================== */\n\n/**\n * 1. Add the correct box sizing in Firefox.\n * 2. Show the overflow in Edge and IE.\n */\n\nhr {\n  box-sizing: content-box; /* 1 */\n  height: 0; /* 1 */\n  overflow: visible; /* 2 */\n}\n\n/**\n * 1. Correct the inheritance and scaling of font size in all browsers.\n * 2. Correct the odd `em` font sizing in all browsers.\n */\n\npre {\n  font-family: monospace, monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/* Text-level semantics\n   ========================================================================== */\n\n/**\n * Remove the gray background on active links in IE 10.\n */\n\na {\n  background-color: transparent;\n}\n\n/**\n * 1. Remove the bottom border in Chrome 57-\n * 2. Add the correct text decoration in Chrome, Edge, IE, Opera, and Safari.\n */\n\nabbr[title] {\n  border-bottom: none; /* 1 */\n  text-decoration: underline; /* 2 */\n  text-decoration: underline dotted; /* 2 */\n}\n\n/**\n * Add the correct font weight in Chrome, Edge, and Safari.\n */\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/**\n * 1. Correct the inheritance and scaling of font size in all browsers.\n * 2. Correct the odd `em` font sizing in all browsers.\n */\n\ncode,\nkbd,\nsamp {\n  font-family: monospace, monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/**\n * Add the correct font size in all browsers.\n */\n\nsmall {\n  font-size: 80%;\n}\n\n/**\n * Prevent `sub` and `sup` elements from affecting the line height in\n * all browsers.\n */\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/* Embedded content\n   ========================================================================== */\n\n/**\n * Remove the border on images inside links in IE 10.\n */\n\nimg {\n  border-style: none;\n}\n\n/* Forms\n   ========================================================================== */\n\n/**\n * 1. Change the font styles in all browsers.\n * 2. Remove the margin in Firefox and Safari.\n */\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  line-height: 1.15; /* 1 */\n  margin: 0; /* 2 */\n}\n\n/**\n * Show the overflow in IE.\n * 1. Show the overflow in Edge.\n */\n\nbutton,\ninput { /* 1 */\n  overflow: visible;\n}\n\n/**\n * Remove the inheritance of text transform in Edge, Firefox, and IE.\n * 1. Remove the inheritance of text transform in Firefox.\n */\n\nbutton,\nselect { /* 1 */\n  text-transform: none;\n}\n\n/**\n * Correct the inability to style clickable types in iOS and Safari.\n */\n\nbutton,\n[type=\"button\"],\n[type=\"reset\"],\n[type=\"submit\"] {\n  -webkit-appearance: button;\n}\n\n/**\n * Remove the inner border and padding in Firefox.\n */\n\nbutton::-moz-focus-inner,\n[type=\"button\"]::-moz-focus-inner,\n[type=\"reset\"]::-moz-focus-inner,\n[type=\"submit\"]::-moz-focus-inner {\n  border-style: none;\n  padding: 0;\n}\n\n/**\n * Restore the focus styles unset by the previous rule.\n */\n\nbutton:-moz-focusring,\n[type=\"button\"]:-moz-focusring,\n[type=\"reset\"]:-moz-focusring,\n[type=\"submit\"]:-moz-focusring {\n  outline: 1px dotted ButtonText;\n}\n\n/**\n * Correct the padding in Firefox.\n */\n\nfieldset {\n  padding: 0.35em 0.75em 0.625em;\n}\n\n/**\n * 1. Correct the text wrapping in Edge and IE.\n * 2. Correct the color inheritance from `fieldset` elements in IE.\n * 3. Remove the padding so developers are not caught out when they zero out\n *    `fieldset` elements in all browsers.\n */\n\nlegend {\n  box-sizing: border-box; /* 1 */\n  color: inherit; /* 2 */\n  display: table; /* 1 */\n  max-width: 100%; /* 1 */\n  padding: 0; /* 3 */\n  white-space: normal; /* 1 */\n}\n\n/**\n * Add the correct vertical alignment in Chrome, Firefox, and Opera.\n */\n\nprogress {\n  vertical-align: baseline;\n}\n\n/**\n * Remove the default vertical scrollbar in IE 10+.\n */\n\ntextarea {\n  overflow: auto;\n}\n\n/**\n * 1. Add the correct box sizing in IE 10.\n * 2. Remove the padding in IE 10.\n */\n\n[type=\"checkbox\"],\n[type=\"radio\"] {\n  box-sizing: border-box; /* 1 */\n  padding: 0; /* 2 */\n}\n\n/**\n * Correct the cursor style of increment and decrement buttons in Chrome.\n */\n\n[type=\"number\"]::-webkit-inner-spin-button,\n[type=\"number\"]::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/**\n * 1. Correct the odd appearance in Chrome and Safari.\n * 2. Correct the outline style in Safari.\n */\n\n[type=\"search\"] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/**\n * Remove the inner padding in Chrome and Safari on macOS.\n */\n\n[type=\"search\"]::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/**\n * 1. Correct the inability to style clickable types in iOS and Safari.\n * 2. Change font properties to `inherit` in Safari.\n */\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/* Interactive\n   ========================================================================== */\n\n/*\n * Add the correct display in Edge, IE 10+, and Firefox.\n */\n\ndetails {\n  display: block;\n}\n\n/*\n * Add the correct display in all browsers.\n */\n\nsummary {\n  display: list-item;\n}\n\n/* Misc\n   ========================================================================== */\n\n/**\n * Add the correct display in IE 10+.\n */\n\ntemplate {\n  display: none;\n}\n\n/**\n * Add the correct display in IE 10.\n */\n\n[hidden] {\n  display: none;\n}\n";
    styleInject(css_248z);

    var css_248z$1 = "*,*:after,*:before{box-sizing:inherit}html{box-sizing:border-box;font-size:62.5%}body{color:#606c76;font-family:'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;font-size:1.6em;font-weight:300;letter-spacing:.01em;line-height:1.6}blockquote{border-left:0.3rem solid #d1d1d1;margin-left:0;margin-right:0;padding:1rem 1.5rem}blockquote *:last-child{margin-bottom:0}.button,button,input[type='button'],input[type='reset'],input[type='submit']{background-color:#9b4dca;border:0.1rem solid #9b4dca;border-radius:.4rem;color:#fff;cursor:pointer;display:inline-block;font-size:1.1rem;font-weight:700;height:3.8rem;letter-spacing:.1rem;line-height:3.8rem;padding:0 3.0rem;text-align:center;text-decoration:none;text-transform:uppercase;white-space:nowrap}.button:focus,.button:hover,button:focus,button:hover,input[type='button']:focus,input[type='button']:hover,input[type='reset']:focus,input[type='reset']:hover,input[type='submit']:focus,input[type='submit']:hover{background-color:#606c76;border-color:#606c76;color:#fff;outline:0}.button[disabled],button[disabled],input[type='button'][disabled],input[type='reset'][disabled],input[type='submit'][disabled]{cursor:default;opacity:.5}.button[disabled]:focus,.button[disabled]:hover,button[disabled]:focus,button[disabled]:hover,input[type='button'][disabled]:focus,input[type='button'][disabled]:hover,input[type='reset'][disabled]:focus,input[type='reset'][disabled]:hover,input[type='submit'][disabled]:focus,input[type='submit'][disabled]:hover{background-color:#9b4dca;border-color:#9b4dca}.button.button-outline,button.button-outline,input[type='button'].button-outline,input[type='reset'].button-outline,input[type='submit'].button-outline{background-color:transparent;color:#9b4dca}.button.button-outline:focus,.button.button-outline:hover,button.button-outline:focus,button.button-outline:hover,input[type='button'].button-outline:focus,input[type='button'].button-outline:hover,input[type='reset'].button-outline:focus,input[type='reset'].button-outline:hover,input[type='submit'].button-outline:focus,input[type='submit'].button-outline:hover{background-color:transparent;border-color:#606c76;color:#606c76}.button.button-outline[disabled]:focus,.button.button-outline[disabled]:hover,button.button-outline[disabled]:focus,button.button-outline[disabled]:hover,input[type='button'].button-outline[disabled]:focus,input[type='button'].button-outline[disabled]:hover,input[type='reset'].button-outline[disabled]:focus,input[type='reset'].button-outline[disabled]:hover,input[type='submit'].button-outline[disabled]:focus,input[type='submit'].button-outline[disabled]:hover{border-color:inherit;color:#9b4dca}.button.button-clear,button.button-clear,input[type='button'].button-clear,input[type='reset'].button-clear,input[type='submit'].button-clear{background-color:transparent;border-color:transparent;color:#9b4dca}.button.button-clear:focus,.button.button-clear:hover,button.button-clear:focus,button.button-clear:hover,input[type='button'].button-clear:focus,input[type='button'].button-clear:hover,input[type='reset'].button-clear:focus,input[type='reset'].button-clear:hover,input[type='submit'].button-clear:focus,input[type='submit'].button-clear:hover{background-color:transparent;border-color:transparent;color:#606c76}.button.button-clear[disabled]:focus,.button.button-clear[disabled]:hover,button.button-clear[disabled]:focus,button.button-clear[disabled]:hover,input[type='button'].button-clear[disabled]:focus,input[type='button'].button-clear[disabled]:hover,input[type='reset'].button-clear[disabled]:focus,input[type='reset'].button-clear[disabled]:hover,input[type='submit'].button-clear[disabled]:focus,input[type='submit'].button-clear[disabled]:hover{color:#9b4dca}code{background:#f4f5f6;border-radius:.4rem;font-size:86%;margin:0 .2rem;padding:.2rem .5rem;white-space:nowrap}pre{background:#f4f5f6;border-left:0.3rem solid #9b4dca;overflow-y:hidden}pre>code{border-radius:0;display:block;padding:1rem 1.5rem;white-space:pre}hr{border:0;border-top:0.1rem solid #f4f5f6;margin:3.0rem 0}input[type='color'],input[type='date'],input[type='datetime'],input[type='datetime-local'],input[type='email'],input[type='month'],input[type='number'],input[type='password'],input[type='search'],input[type='tel'],input[type='text'],input[type='url'],input[type='week'],input:not([type]),textarea,select{-webkit-appearance:none;background-color:transparent;border:0.1rem solid #d1d1d1;border-radius:.4rem;box-shadow:none;box-sizing:inherit;height:3.8rem;padding:.6rem 1.0rem .7rem;width:100%}input[type='color']:focus,input[type='date']:focus,input[type='datetime']:focus,input[type='datetime-local']:focus,input[type='email']:focus,input[type='month']:focus,input[type='number']:focus,input[type='password']:focus,input[type='search']:focus,input[type='tel']:focus,input[type='text']:focus,input[type='url']:focus,input[type='week']:focus,input:not([type]):focus,textarea:focus,select:focus{border-color:#9b4dca;outline:0}select{background:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 30 8\" width=\"30\"><path fill=\"%23d1d1d1\" d=\"M0,0l6,8l6-8\"/></svg>') center right no-repeat;padding-right:3.0rem}select:focus{background-image:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 30 8\" width=\"30\"><path fill=\"%239b4dca\" d=\"M0,0l6,8l6-8\"/></svg>')}select[multiple]{background:none;height:auto}textarea{min-height:6.5rem}label,legend{display:block;font-size:1.6rem;font-weight:700;margin-bottom:.5rem}fieldset{border-width:0;padding:0}input[type='checkbox'],input[type='radio']{display:inline}.label-inline{display:inline-block;font-weight:normal;margin-left:.5rem}.container{margin:0 auto;max-width:112.0rem;padding:0 2.0rem;position:relative;width:100%}.row{display:flex;flex-direction:column;padding:0;width:100%}.row.row-no-padding{padding:0}.row.row-no-padding>.column{padding:0}.row.row-wrap{flex-wrap:wrap}.row.row-top{align-items:flex-start}.row.row-bottom{align-items:flex-end}.row.row-center{align-items:center}.row.row-stretch{align-items:stretch}.row.row-baseline{align-items:baseline}.row .column{display:block;flex:1 1 auto;margin-left:0;max-width:100%;width:100%}.row .column.column-offset-10{margin-left:10%}.row .column.column-offset-20{margin-left:20%}.row .column.column-offset-25{margin-left:25%}.row .column.column-offset-33,.row .column.column-offset-34{margin-left:33.3333%}.row .column.column-offset-40{margin-left:40%}.row .column.column-offset-50{margin-left:50%}.row .column.column-offset-60{margin-left:60%}.row .column.column-offset-66,.row .column.column-offset-67{margin-left:66.6666%}.row .column.column-offset-75{margin-left:75%}.row .column.column-offset-80{margin-left:80%}.row .column.column-offset-90{margin-left:90%}.row .column.column-10{flex:0 0 10%;max-width:10%}.row .column.column-20{flex:0 0 20%;max-width:20%}.row .column.column-25{flex:0 0 25%;max-width:25%}.row .column.column-33,.row .column.column-34{flex:0 0 33.3333%;max-width:33.3333%}.row .column.column-40{flex:0 0 40%;max-width:40%}.row .column.column-50{flex:0 0 50%;max-width:50%}.row .column.column-60{flex:0 0 60%;max-width:60%}.row .column.column-66,.row .column.column-67{flex:0 0 66.6666%;max-width:66.6666%}.row .column.column-75{flex:0 0 75%;max-width:75%}.row .column.column-80{flex:0 0 80%;max-width:80%}.row .column.column-90{flex:0 0 90%;max-width:90%}.row .column .column-top{align-self:flex-start}.row .column .column-bottom{align-self:flex-end}.row .column .column-center{align-self:center}@media (min-width: 40rem){.row{flex-direction:row;margin-left:-1.0rem;width:calc(100% + 2.0rem)}.row .column{margin-bottom:inherit;padding:0 1.0rem}}a{color:#9b4dca;text-decoration:none}a:focus,a:hover{color:#606c76}dl,ol,ul{list-style:none;margin-top:0;padding-left:0}dl dl,dl ol,dl ul,ol dl,ol ol,ol ul,ul dl,ul ol,ul ul{font-size:90%;margin:1.5rem 0 1.5rem 3.0rem}ol{list-style:decimal inside}ul{list-style:circle inside}.button,button,dd,dt,li{margin-bottom:1.0rem}fieldset,input,select,textarea{margin-bottom:1.5rem}blockquote,dl,figure,form,ol,p,pre,table,ul{margin-bottom:2.5rem}table{border-spacing:0;display:block;overflow-x:auto;text-align:left;width:100%}td,th{border-bottom:0.1rem solid #e1e1e1;padding:1.2rem 1.5rem}td:first-child,th:first-child{padding-left:0}td:last-child,th:last-child{padding-right:0}@media (min-width: 40rem){table{display:table;overflow-x:initial}}b,strong{font-weight:bold}p{margin-top:0}h1,h2,h3,h4,h5,h6{font-weight:300;letter-spacing:-.1rem;margin-bottom:2.0rem;margin-top:0}h1{font-size:4.6rem;line-height:1.2}h2{font-size:3.6rem;line-height:1.25}h3{font-size:2.8rem;line-height:1.3}h4{font-size:2.2rem;letter-spacing:-.08rem;line-height:1.35}h5{font-size:1.8rem;letter-spacing:-.05rem;line-height:1.5}h6{font-size:1.6rem;letter-spacing:0;line-height:1.4}img{max-width:100%}.clearfix:after{clear:both;content:' ';display:table}.float-left{float:left}.float-right{float:right}";
    styleInject(css_248z$1);

    var css_248z$2 = "button {\n  background-color: #194577;\n  border: 0.1rem solid #0c78c3;\n  color: #eadb0b;\n}\n\n.flag {\n  padding: 2px;\n}\n\n.flag-border {\n  padding: 1px;\n  border: 1px solid red;\n}\n\n@font-face {\n  font-family: \"Star Jedi Outline\";\n  src: url(\"/api/v1/web/nuvolaris/default/faaswars/font/StarJediOutline.woff2\") format(\"woff2\"),\n    url(\"/api/v1/web/nuvolaris/default/faaswars/font/StarJediOutline.woff\") format(\"woff\");\n  font-weight: normal;\n  font-style: normal;\n  font-display: swap;\n}\n\n@font-face {\n  font-family: \"Noto Sans\";\n  src: url(\"/api/v1/web/nuvolaris/default/faaswars/font/NotoSans.woff2\") format(\"woff2\"),\n    url(\"/api/v1/web/nuvolaris/default/faaswars/font/NotoSans.woff\") format(\"woff\");\n  font-weight: normal;\n  font-style: normal;\n  font-display: swap;\n}\n\nh1 {\n  font-family: \"Star Jedi Outline\";\n  color: darkorange;\n}\n\nh2,\nh3,\nh4 {\n  font-family: \"Noto Sans\";\n  color: darkorange;\n}\n\na {\n  color:orangered;\n}\n\ncanvas {\n  padding: 0;\n  margin: auto;\n  display: block;\n  width: 100%;\n}\n\n@media screen and (min-width: 600px) {\n  .container {\n    padding: 0 2px;\n  }\n\n  .row .column.column-offset {\n    margin-left: 0%;\n  }\n\n  .center {\n    margin: 0;\n  }\n\n  div.center {\n    margin-left: 0;\n  }\n\n  canvas {\n    margin: 0;\n  }\n  h1,\n  a,\n  h3,\n  h4 {\n    text-align: left;\n    margin-left: 0;\n    margin-right: 0;\n  }\n  .row .column.column-left {\n    flex: 0 0 25%;\n    max-width: 50%;\n  }\n  .row .column.column-right {\n    flex: 0 0 25%;\n    max-width: 50%;\n  }\n  .row .column.column-center {\n    flex: 0 0 50%;\n    max-width: 50%;\n  }\n}\n\n@media screen and (min-width: 800px) {\n  .row .column.column-offset {\n    margin-left: 25%;\n  }\n  .center {\n    margin: auto;\n  }\n  div.center {\n    margin-left: auto;\n    margin-right: auto;\n  }\n  canvas {\n    padding: 0;\n    margin: auto;\n    display: block;\n    width: 500px;\n    height: 500px;\n  }\n  h1,\n  a,\n  h3,\n  h4 {\n    text-align: center;\n    margin-left: auto;\n    margin-right: auto;\n  }\n\n  .row .column.column-left {\n    flex: 0 0 25%;\n    max-width: 25%;\n  }\n\n  .row .column.column-right {\n    flex: 0 0 25%;\n    max-width: 25%;\n  }\n\n  .row .column.column-center {\n    flex: 0 0 50%;\n    max-width: 50%;\n  }\n}\n";
    styleInject(css_248z$2);

    class OpenWhisk {
        constructor(apihost, key, namespace) {
            this.ext2kind = {
                "go": "go:1.17",
                "js": "nodejs:14",
                "py": "python:3"
            };
            this.base = apihost + "/api/v1/namespaces/_/";
            this.auth = "Basic " + btoa(key);
            this.namespace = namespace;
        }
        // execute an authenticated get to the given url
        // returns the body as text
        async authGet(url) {
            let req = {
                method: 'GET',
                headers: {
                    'Authorization': this.auth
                }
            };
            return await fetch(url, req)
                .then((resp) => {
                if (resp.ok)
                    return resp.text();
                return "ERROR";
            })
                .catch((err) => {
                return "ERROR";
            });
        }
        // handle a request
        // accepts: <method>:<action>
        // compose a request with authentication, methods and body
        // handle errors and rew
        async call(action, body) {
            let a = action.split(":");
            let url = this.base + a.pop();
            let req = {
                method: a.length == 0 ? 'GET' : a[0],
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.auth
                }
            };
            if (body)
                req["body"] = JSON.stringify(body);
            return await fetch(url, req)
                .then((resp) => {
                if (resp.ok)
                    return resp.json();
                return {
                    "error": resp.statusText,
                    "code": resp.status
                };
            })
                .catch((err) => {
                return {
                    "error": err,
                    "code": "999"
                };
            });
        }
        async list() {
            let res = [];
            let actions = await this.call("actions");
            //console.log(actions)
            for (let action of actions) {
                for (let ann of action["annotations"]) {
                    if (ann["key"] == "nimbot") {
                        res.push(action["name"] + "." + ann["value"]);
                    }
                }
            }
            return res;
        }
        async load(filename) {
            let name = filename.split(".")[0];
            let data = await this.call("actions/" + name + "?code=true");
            if ("error" in data) {
                return data["error"];
            }
            //console.log("load", data)
            let code = data["exec"]["code"];
            return code;
        }
        async del(filename) {
            let name = filename.split(".")[0];
            return await this.call("DELETE:actions/" + name);
        }
        async save(file, code, update) {
            let [name, ext] = file.split(".");
            let action = "PUT:actions/" + name + (update ? "?overwrite=true" : "");
            return await this.call(action, {
                namespace: "_",
                name: name,
                publish: true,
                exec: {
                    kind: this.ext2kind[ext],
                    binary: false,
                    code: code
                },
                annotations: [{
                        key: "nimbot",
                        value: ext
                    }, {
                        key: "web-export",
                        value: true
                    }]
            });
        }
    }

    let namespace = "nimbots";
    const VERSION = "1.3";
    const URL_PUBLIC = `https://apigcp.nimbella.io/api/v1/web/nimbots/rumble/public`;
    const URL_REGISTER = `https://apigcp.nimbella.io/api/v1/web/${namespace}/rumble/register`;
    const URL_BASE = `https://apigcp.nimbella.io/api/v1/web/`;

    const HP = 5;
    const BULLET_SPEED = 3;
    const MAX_BULLET = 5;
    const BULLET_INTERVAL = 50;
    const ROBOT_RADIUS = 5;
    function degrees2radians(degrees) {
        return degrees * (Math.PI / 180);
    }
    function radians2degrees(radians) {
        return radians * (180 / Math.PI);
    }
    function euclidDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
    function inRect(x1, y1, x2, y2, width, height) {
        return (x2 + width) > x1 && x1 > x2 && (y2 + height) > y1 && y1 > y2;
    }
    class Logger {
        constructor() {
            this.requestOn = false;
            this.actionOn = false;
            this.eventOn = false;
            this.statesOn = false;
            this.stateInterval = 1;
            this.hitOn = false;
        }
        state(n, state0, state1) {
            if (this.statesOn) {
                if ((n % this.stateInterval) == 0) {
                    console.log(n, state0, state1);
                }
            }
        }
        hit(n, state) {
            if (this.hitOn) {
                console.log("*** hit", n, state);
            }
        }
        request(...args) {
            if (this.requestOn)
                console.log("request:", ...args);
        }
        action(...args) {
            if (this.actionOn)
                console.log("action:", ...args);
        }
        event(...args) {
            if (this.eventOn)
                console.log("event:", ...args);
        }
    }
    let log = new Logger();
    class Robot {
        constructor(x, y, url, extra, completed_request, hit_robot) {
            this.data = {};
            this.id = 0;
            this.hp = 0;
            this.hp_total = 0;
            this.tank_angle = 0;
            this.turret_angle = 0;
            this.radar_angle = 0;
            this.event_counter = 0;
            this.events = [];
            this.bullets = [];
            this.status = {
                wall_collide: false,
                is_hit: false
            };
            this.is_hit = false;
            this.is_yell = false;
            this.is_spot = false;
            this.yell_ts = 0;
            this.yell_msg = "";
            this.bullet_ts = 0;
            this.enemy_spot = {};
            this.action_to_collide = 0;
            this.waiting_for_response = false;
            this.just_spotted = false;
            this.enemies = [];
            this.inspect = function () { };
            this.actions = [
                "move_forwards",
                "move_backwards",
                "move_opposide",
                "turn_left",
                "turn_right",
                "turn_turret_left",
                "turn_turret_right",
                "yell",
                "shoot",
                "data"
            ];
            this.x = x;
            this.y = y;
            this.url = url;
            this.completed_request = completed_request;
            this.hit_robot = hit_robot;
            this.name = url.split("/").pop();
            this.hp_total = HP + extra;
            this.hp = this.hp_total;
        }
        init(enemies, tank_angle, turret_angle) {
            this.enemies = enemies;
            this.turret_angle = turret_angle;
            this.tank_angle = tank_angle;
        }
        move(distance) {
            log.action(this.id, "move", distance);
            let newX = this.x + distance * Math.cos(degrees2radians(this.tank_angle));
            let newY = this.y + distance * Math.sin(degrees2radians(this.tank_angle));
            if (inRect(newX, newY, 15, 15, Robot.battlefield_width - 15, Robot.battlefield_height - 15)) {
                // hit the wall
                //console.log("not-wall-collide")
                this.status.wall_collide = false;
                this.x = newX;
                this.y = newY;
            }
            else {
                //console.log("wall-collide")
                this.status.wall_collide = true;
            }
        }
        turn(degrees) {
            log.action(this.id, "turn", degrees);
            this.tank_angle += degrees;
            this.tank_angle = this.tank_angle % 360;
            if (this.tank_angle < 0)
                this.tank_angle += 360;
        }
        turn_turret(degrees) {
            log.action(this.id, "turn_turret", degrees);
            this.turret_angle += degrees;
            this.turret_angle = this.turret_angle % 360;
            if (this.turret_angle < 0)
                this.turret_angle += 360;
        }
        yell(msg) {
            log.action(this.id, "yell", msg);
            this.is_yell = true;
            this.yell_ts = 0;
            this.yell_msg = msg;
        }
        async send(msg) {
            let json = JSON.stringify(msg, null, 2);
            ++this.event_counter;
            this.inspect(this.id, this.event_counter, json, undefined);
            log.event(this.id, JSON.stringify(msg));
            this.waiting_for_response = true;
            return fetch(this.url, {
                "method": 'POST',
                "headers": { 'Content-Type': 'application/json' },
                "body": json
            }).then(response => {
                if (response.ok)
                    return response.text();
                throw "Broken Robot Controller";
            }).then((json) => {
                //console.log(json)  
                this.waiting_for_response = false;
                let newEvents = [];
                for (let event of this.decode(json)) {
                    event.progress = 0;
                    log.request(this.id, event);
                    newEvents.push(event);
                }
                this.events = newEvents;
                //console.log(newEvents)
                // stop after this sendrec
                this.completed_request("Round completed.", true);
                return true;
            }).catch((err) => {
                this.waiting_for_response = false;
                console.log(err);
                this.completed_request("ERROR: " + err, false);
                return false;
            });
        }
        async send_event(event) {
            return this.send({
                "event": event,
                "energy": this.hp,
                "x": Math.floor(this.me.x),
                "y": Math.floor(this.me.y),
                "angle": Math.floor(this.me.angle),
                "tank_angle": Math.floor(this.me.tank_angle),
                "turret_angle": Math.floor(this.me.turret_angle),
                "enemy_spot": this.enemy_spot,
                "data": this.data
            });
        }
        check_enemy_spot() {
            this.enemy_spot = {};
            let is_spot = false;
            for (let enemy_robot of this.enemies) {
                let my_angle = (this.tank_angle + this.turret_angle) % 360;
                my_angle = my_angle < 0 ? 360 + my_angle : my_angle;
                let my_radians = degrees2radians(my_angle);
                let enemy_position_radians = Math.atan2(enemy_robot.y - this.y, enemy_robot.x - this.x);
                let distance = euclidDistance(this.x, this.y, enemy_robot.x, enemy_robot.y);
                let radians_diff = Math.atan2(ROBOT_RADIUS, distance);
                // XXX a dirty shift
                //my_radians = Math.abs(my_radians)
                if (my_radians > Math.PI)
                    my_radians -= (2 * Math.PI);
                if (my_radians < -Math.PI)
                    my_radians += (2 * Math.PI);
                //console.log(this.id, "check id me him diff", enemy_robot.id, my_radians, enemy_position_radians, radians_diff)
                let max = enemy_position_radians + radians_diff;
                let min = enemy_position_radians - radians_diff;
                if (my_radians >= min && my_radians <= max) {
                    let enemy_position_degrees = radians2degrees(enemy_position_radians);
                    if (enemy_position_degrees < 0)
                        enemy_position_degrees = 360 + enemy_position_degrees;
                    this.enemy_spot = {
                        id: enemy_robot.id,
                        x: Math.floor(enemy_robot.x),
                        y: Math.floor(enemy_robot.y),
                        angle: Math.floor(enemy_position_degrees),
                        distance: Math.floor(distance),
                        energy: enemy_robot.hp,
                    };
                    is_spot = true;
                }
            }
            if (is_spot)
                return true;
            return false;
        }
        update_bullet() {
            let i = -1;
            for (let b of this.bullets) {
                i++;
                b.x += BULLET_SPEED * Math.cos(degrees2radians(b.direction));
                b.y += BULLET_SPEED * Math.sin(degrees2radians(b.direction));
                let bullet_wall_collide = !inRect(b.x, b.y, 2, 2, Robot.battlefield_width - 2, Robot.battlefield_height - 2);
                if (bullet_wall_collide) {
                    b = null;
                    this.bullets.splice(i, 1);
                    continue;
                }
                let j = -1;
                for (let enemy_robot of this.enemies) {
                    j++;
                    let robot_hit = (euclidDistance(b.x, b.y, enemy_robot.x, enemy_robot.y) < 20);
                    if (robot_hit) {
                        enemy_robot.hp -= 1;
                        enemy_robot.is_hit = true;
                        this.hit_robot(enemy_robot.x, enemy_robot.y);
                        b = null;
                        this.bullets.splice(j, 1);
                        log.hit(enemy_robot.id, enemy_robot.state());
                        break;
                    }
                }
            }
        }
        state() {
            if (this.me) {
                let me = this.me;
                return `${me.id}: e=${Math.floor(me.hp)} x=${Math.floor(me.x)} y=${Math.floor(me.y)} angle=${Math.floor(me.angle)} tank=${Math.floor(me.tank_angle)} turret=${Math.floor(me.turret_angle)}`;
            }
            return "";
        }
        async update() {
            //console.log("update")
            this.me = {
                angle: (this.tank_angle + this.turret_angle) % 360,
                tank_angle: this.tank_angle,
                turret_angle: this.turret_angle,
                id: this.id,
                x: this.x,
                y: this.y,
                hp: this.hp
            };
            //console.log(this.me)
            if (this.bullet_ts == Number.MAX_VALUE)
                this.bullet_ts = 0;
            else
                this.bullet_ts++;
            if (this.bullets.length > 0)
                this.update_bullet();
            // parallel actions
            let already_turned = false;
            for (let event of this.events) {
                switch (event.action) {
                    case "shoot":
                        //console.log("par event", this.id,  event.action)
                        if (this.bullets.length >= MAX_BULLET || this.bullet_ts < BULLET_INTERVAL) {
                            continue;
                        }
                        event.progress = 1;
                        this.bullet_ts = 0;
                        let bullet = {
                            x: this.x, y: this.y,
                            direction: this.tank_angle + this.turret_angle
                        };
                        this.bullets.push(bullet);
                        continue;
                    case "data":
                        //console.log(this.id, "par", event.action)
                        this.data = event.data;
                        event.progress = 1;
                        continue;
                    case "yell":
                        //console.log(this.id, "par", event.action)
                        if (this.yell_ts == 0) {
                            this.yell(event.msg);
                        }
                        event.progress = 1;
                        continue;
                    case "turn_turret_left":
                        //console.log(this.id, "par", event.action)
                        if (!already_turned) {
                            event.progress++;
                            this.turn_turret(-1);
                            already_turned = true;
                        }
                        continue;
                    case "turn_turret_right":
                        //console.log(this.id, "par", event.action)
                        if (!already_turned) {
                            event.progress++;
                            this.turn_turret(1);
                            already_turned = true;
                        }
                        continue;
                }
            }
            // sequential actions
            let newEvents = [];
            //console.log("processing seq", this.events)
            let processed = false;
             for (let event of this.events) {
                if (event.progress < event.amount) {
                    //console.log("keeping", event.action)
                    newEvents.push(event);
                }
                else {
                    //console.log("dropping", event.action)
                    continue;
                }
                // handle parallel action
                if (!processed)
                    switch (event.action) {
                        case "move_forwards":
                            //console.log("sequential", this.id, event.action)
                            event.progress++;
                            this.move(1);
                            if (this.status.wall_collide) {
                                this.action_to_collide = 1; //#forward
                            }
                            processed = true;
                            break;
                        case "move_backwards":
                            //console.log(this.id, "seq", event.action)
                            event.progress++;
                            this.move(-1);
                            if (this.status.wall_collide) {
                                this.action_to_collide = -1; //#backward
                            }
                            processed = true;
                            break;
                        case "move_opposide":
                            //console.log(this.id, "seq", event.action)
                            event.progress++;
                            this.move(-this.action_to_collide);
                            if (this.status.wall_collide) {
                                this.action_to_collide = -this.action_to_collide;
                            }
                            processed = true;
                            break;
                        case "turn_left":
                            //console.log(this.id, "seq", event.action)
                            event.progress++;
                            this.turn(-1);
                            processed = true;
                            break;
                        case "turn_right":
                            //console.log(this.id, "seq", event.action)
                            event.progress++;
                            this.turn(1);
                            processed = true;
                            break;
                    }
            }
            this.events = newEvents;
            // check if we spotted the enemy
            if (!this.is_spot && this.check_enemy_spot()) {
                this.is_spot = true;
                //console.log(this.id, "spotted enemy!")
            }
            if (!this.waiting_for_response) {
                // check if spotted enemy
                if (this.is_spot && !this.just_spotted) {
                    //console.log(this.id, "sending spot")
                    this.is_spot = false;
                    this.just_spotted = true;
                    return this.send_event("enemy-spot");
                }
                if (this.is_hit) {
                    this.status.is_hit = true;
                    this.events = [];
                    return this.send_event("hit").then((res) => {
                        this.is_hit = false;
                        this.just_spotted = false;
                        return res;
                    });
                }
                // check collision
                if (this.status.wall_collide) {
                    this.events = [];
                    return this.send_event("wall-collide").then((res) => {
                        this.just_spotted = false;
                        return res;
                    });
                }
                // notify idle
                if (this.events.length == 0) {
                    // check if it is hit
                    return this.send_event("idle").then((res) => {
                        this.just_spotted = false;
                        return res;
                    });
                }
            }
            return true;
        }
        checkEvent(event) {
            for (let key in event) {
                if (this.actions.indexOf(key) == -1)
                    return "ERROR! '" + key + "' ???";
            }
            return "";
        }
        decode(json) {
            let data = JSON.parse(json);
            this.inspect(this.id, this.event_counter, undefined, JSON.stringify(data, null, 2));
            let events;
            let res = [];
            if (typeof (data) === "object") {
                if (Array.isArray(data)) {
                    events = data;
                }
                else {
                    events = [data];
                }
            }
            else {
                events = [];
            }
            // expand commands
            for (let event of events) {
                // it is an action
                if ("action" in event) {
                    res.push(event);
                    continue;
                }
                let err = this.checkEvent(event);
                if (err != "") {
                    res.push({
                        "action": "yell",
                        "msg": err,
                        "amount": 1
                    });
                    console.log(err);
                }
                // short form
                if ("data" in event) {
                    res.push({
                        "action": "data",
                        "data": event["data"],
                        "amount": 1
                    });
                }
                if ("yell" in event) {
                    res.push({
                        "action": "yell",
                        "msg": event["yell"],
                        "amount": 1
                    });
                }
                if ("shoot" in event) {
                    if (event.shoot)
                        res.push({
                            "action": "shoot",
                            "amount": 1
                        });
                }
                // left or right but not both
                if ("turn_turret_right" in event) {
                    res.push({
                        "action": "turn_turret_right",
                        "amount": event["turn_turret_right"]
                    });
                }
                else if ("turn_turret_left" in event) {
                    res.push({
                        "action": "turn_turret_left",
                        "amount": event["turn_turret_left"]
                    });
                }
                // sequential actions
                if ("move_opposide" in event) {
                    res.push({
                        "action": "move_opposide",
                        "amount": event["move_opposide"]
                    });
                    continue;
                }
                if ("move_forwards" in event) {
                    res.push({
                        "action": "move_forwards",
                        "amount": event["move_forwards"]
                    });
                    delete event["move_forwards"];
                    continue;
                }
                if ("move_backwards" in event) {
                    res.push({
                        "action": "move_backwards",
                        "amount": event["move_backwards"]
                    });
                    delete event["move_backwards"];
                    continue;
                }
                if ("turn_left" in event) {
                    res.push({
                        "action": "turn_left",
                        "amount": event["turn_left"]
                    });
                    delete event["turn_left"];
                    continue;
                }
                if ("turn_right" in event) {
                    res.push({
                        "action": "turn_right",
                        "amount": event["turn_right"]
                    });
                    continue;
                }
            }
            return res;
        }
    }
    Robot.battlefield_width = 0;
    Robot.battlefield_height = 0;

    class Battle {
        constructor(width, height, end_battle, suspend_battle) {
            this.suspended = true;
            this.tracing = true;
            this.timeout = 0;
            this.duration = -1;
            this.title = "";
            Robot.battlefield_height = height;
            Robot.battlefield_width = width;
            this.width = width;
            this.height = height;
            this.end_battle = end_battle;
            this.suspend_battle = suspend_battle;
            Battle.battle = this;
        }
        init(urls, startAngles, duration, extra) {
            this.duration = duration;
            this.title = urls[0].split("/").pop() + " vs " + urls[1].split("/").pop();
            // calculate appearing position
            let robotAppearPosY = this.height / 2;
            let robotAppearPosXInc = this.width / 3;
            let robotAppearPosX = robotAppearPosXInc;
            let id = 0;
            Battle.robots = [];
            for (let url of urls) {
                let r = new Robot(robotAppearPosX, robotAppearPosY, url, extra[id], (msg, ok) => { this.completed_request(msg, ok); }, (x, y) => { this.hit_robot(x, y); });
                r.id = id++;
                Battle.robots.push(r);
                // next appear position
                robotAppearPosX += robotAppearPosXInc;
                //robotAppearPosY += 100
                if (id >= 2) {
                    robotAppearPosX = Math.random() * (this.width - 100 + 20);
                }
            }
            // inject enemies
            let i = 0;
            for (let rr of Battle.robots) {
                let enemies = [];
                for (let r of Battle.robots)
                    if (r.id != rr.id)
                        enemies.push(r);
                rr.init(enemies, startAngles[i][0], startAngles[i][1]);
                i++;
            }
        }
        robotState(i) {
            // if battle is over do not return state
            if (Battle.robots.length != 2) {
                return "";
            }
            return Battle.robots[i].state();
        }
        robotName(i) {
            if (Battle.robots.length != 2) {
                return "";
            }
            return Battle.robots[i].name;
        }
        completed_request(msg, ok) {
            if (!ok) {
                this.suspended = true;
                this.suspend_battle(msg, this.robotState(0), this.robotState(1));
            }
        }
        hit_robot(x, y) {
            Battle.explosions.push({
                x: x,
                y: y,
                progress: 1
            });
        }
        async loop() {
            // update robots
            for (let robot of Battle.robots) {
                robot.update().then((ok) => {
                    if (!ok) {
                        this.stop();
                        this.end_battle(robot.id == 0 ? 1 : 0);
                    }
                });
            }
            // refresh
            this.draw();
            log.state(this.duration, this.robotState(0), this.robotState(1));
            // is the battle over?
            this.duration--;
            if (this.duration == 0) {
                // end battle with a draw
                this.end_battle(-1);
                this.stop();
                return;
            }
            // check battle status 
            // are explosion finished so we can declare game over?
            if (Battle.explosions.length == 0 && Battle.robots.length <= 1) {
                if (Battle.robots.length == 0)
                    this.end_battle(-1);
                else
                    this.end_battle(Battle.robots[0].id);
                this.stop();
            }
            // iterate
            if (this.tracing) {
                this.suspend_battle("Tracing... (suspended)", this.robotState(0), this.robotState(1));
                return;
            }
            if (!this.suspended)
                this.timeout = setTimeout(() => this.loop(), Battle.speed);
        }
        draw() {
            // update robots removing when dead
            let newRobots = [];
            for (let robot of Battle.robots) {
                if (robot.hp > 0)
                    newRobots.push(robot);
            }
            Battle.robots = newRobots;
            // handle pseudo explosions
            for (let i of Battle.explosions) {
                let explosion = Battle.explosions.pop();
                if (explosion.progress <= 17) {
                    explosion.progress += 1;
                    Battle.explosions.unshift(explosion);
                }
            }
        }
        stop() {
            this.suspended = true;
            clearTimeout(this.timeout);
        }
        terminate() {
            this.stop();
            this.end_battle(-2);
        }
        start() {
            this.suspended = false;
            this.tracing = false;
            this.loop();
            return this.title;
        }
        trace() {
            this.suspended = true;
            this.tracing = true;
            this.loop();
            return this.title;
        }
    }
    Battle.robots = [];
    Battle.explosions = [];
    Battle.speed = 10;

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const inspector = writable([{ n: 0, req: "", res: "", state: "" }, { n: 0, req: "", res: "", state: "" }]);
    const source = writable("");
    const rewards = writable(0);
    const ow = writable(undefined);

    class AssetsLoader {
        constructor(sources) {
            this.assets = {};
            this.loaded = 0;
            this.total = 0;
            this.sources = sources;
        }
        get(name) {
            return this.assets[name];
        }
        loadAll(callback) {
            for (let name in this.sources) {
                this.assets[name] = new Image();
                this.assets[name].src = this.sources[name];
                ++this.total;
            }
            for (let name in this.assets) {
                this.assets[name].onload = () => {
                    ++this.loaded;
                    if (this.total == this.loaded)
                        callback();
                };
            }
        }
    }

    const YELL_TIMEOUT = 50;
    let Assets = new AssetsLoader({
        "splash": 'img/splash.png',
        "background": 'img/background.png',
        "body": 'img/body.png',
        "body-red": 'img/body-red.png',
        "turret": 'img/turret.png',
        "turret-red": 'img/turret-red.png',
        'explosion1-1': 'img/explosion/explosion1-1.png',
        'explosion1-2': 'img/explosion/explosion1-2.png',
        'explosion1-3': 'img/explosion/explosion1-3.png',
        'explosion1-4': 'img/explosion/explosion1-4.png',
        'explosion1-5': 'img/explosion/explosion1-5.png',
        'explosion1-6': 'img/explosion/explosion1-6.png',
        'explosion1-7': 'img/explosion/explosion1-7.png',
        'explosion1-8': 'img/explosion/explosion1-8.png',
        'explosion1-9': 'img/explosion/explosion1-9.png',
        'explosion1-10': 'img/explosion/explosion1-10.png',
        'explosion1-11': 'img/explosion/explosion1-11.png',
        'explosion1-12': 'img/explosion/explosion1-12.png',
        'explosion1-13': 'img/explosion/explosion1-13.png',
        'explosion1-14': 'img/explosion/explosion1-14.png',
        'explosion1-15': 'img/explosion/explosion1-15.png',
        'explosion1-16': 'img/explosion/explosion1-16.png',
        'explosion1-17': 'img/explosion/explosion1-17.png'
    });
    function inspect(id, counter, request, response) {
        inspector.update((info) => {
            if (counter !== undefined)
                info[id].n = counter;
            if (request !== undefined)
                info[id].req = request;
            if (response !== undefined)
                info[id].res = response;
            return info;
        });
    }
    class BattleWeb extends Battle {
        constructor(width, height, end_battle, suspend_battle) {
            super(width, height, end_battle, suspend_battle);
            Assets.loadAll(() => { });
        }
        webinit(ctx, url, startAngles, extra) {
            this.ctx = ctx;
            this.init(url, startAngles, -1, extra);
            for (let r of Battle.robots)
                r.inspect = inspect;
        }
        draw() {
            //this.ctx.clearRect(0, 0, this.width, this.height)
            this.ctx.drawImage(Assets.get("background"), 0, 0, this.width, this.height);
            let newRobots = [];
            for (let robot of Battle.robots) {
                let body = robot.id == 0 ? "body" : "body-red";
                let turret = robot.id == 0 ? "turret" : "turret-red";
                if (robot.hp <= 0) {
                    Battle.explosions.push({
                        x: robot.x,
                        y: robot.y,
                        progress: 1
                    });
                    continue;
                }
                else {
                    newRobots.push(robot);
                }
                this.ctx.save();
                this.ctx.translate(robot.x, robot.y);
                // draw text
                this.ctx.textAlign = "left";
                this.ctx.textBaseline = "top";
                let textX = 20;
                let textY = 20;
                if ((this.width - robot.x) < 100) {
                    textX = -textX;
                    this.ctx.textAlign = "right";
                }
                if ((this.height - robot.y) < 100)
                    textY = -textY;
                let text = `${robot.hp}/${robot.hp_total}`;
                // check yelling
                if (robot.is_yell && (robot.yell_ts < YELL_TIMEOUT)) {
                    this.ctx.font = "18px Verdana";
                    text = robot.yell_msg;
                    robot.yell_ts++;
                }
                else {
                    this.ctx.font = "14px Courier";
                    robot.yell_ts = 0;
                    robot.is_yell = false;
                }
                this.ctx.fillStyle = "#FFFFFF";
                this.ctx.fillText(text, textX, textY);
                this.ctx.rotate(degrees2radians(robot.tank_angle));
                this.ctx.drawImage(Assets.get(body), -(50 / 2), -(50 / 2), 50, 50);
                this.ctx.rotate(degrees2radians(robot.turret_angle));
                this.ctx.drawImage(Assets.get(turret), -(50 / 2), -(25 / 2), 50, 25);
                this.ctx.rotate(degrees2radians(robot.radar_angle));
                //this.ctx.drawImage(Assets.get("radar"), -(16 / 2), -(22 / 2), 16, 22)
                this.ctx.restore();
                if (robot.bullets.length > 0) {
                    for (let b of robot.bullets) {
                        this.ctx.save();
                        this.ctx.translate(b.x, b.y);
                        this.ctx.rotate(degrees2radians(b.direction));
                        this.ctx.fillStyle = "#FFFFFF";
                        this.ctx.fillRect(-3, -3, 6, 6);
                        this.ctx.restore();
                    }
                }
            }
            Battle.robots = newRobots;
            for (let i of Battle.explosions) {
                let explosion = Battle.explosions.pop();
                if (explosion.progress <= 17) {
                    this.ctx.drawImage(Assets.get("explosion1-" + explosion.progress), explosion.x - 64, explosion.y - 64, 128, 128);
                    explosion.progress += 1;
                    Battle.explosions.unshift(explosion);
                }
            }
        }
    }

    function rumbleSave(name, code) {
        let data = {
            key: name,
            value: code
        };
        return fetch(URL_REGISTER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
            .then((resp) => resp.text())
            .then((value) => value);
    }
    async function rumblePublic() {
        return fetch(URL_PUBLIC)
            .then((resp) => resp.json())
            .catch((err) => []);
    }

    /* src/Field.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/Field.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[57] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[62] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[57] = list[i];
    	return child_ctx;
    }

    // (271:6) {:else}
    function create_else_block_5(ctx) {
    	let h1;
    	let t;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t = text(/*msg*/ ctx[2]);
    			add_location(h1, file, 271, 8, 8146);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*msg*/ 4) set_data_dev(t, /*msg*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_5.name,
    		type: "else",
    		source: "(271:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (263:6) {#if msg == ""}
    function create_if_block_6(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			set_style(img, "padding-bottom", "20px");
    			attr_dev(img, "alt", "banner");
    			attr_dev(img, "width", "500");
    			attr_dev(img, "class", "center");
    			if (img.src !== (img_src_value = "img/banner.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file, 263, 8, 7968);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(263:6) {#if msg == \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (378:4) {:else}
    function create_else_block_3(ctx) {
    	let div0;
    	let h3;
    	let t0;
    	let t1;
    	let div1;
    	let h1;
    	let span0;
    	let t2_value = /*battle*/ ctx[1].robotName(0) + "";
    	let t2;
    	let t3;
    	let span1;
    	let t4_value = /*battle*/ ctx[1].robotName(1) + "";
    	let t4;
    	let t5;
    	let div4;
    	let div2;
    	let br0;
    	let t6;
    	let button0;
    	let t7;
    	let br1;
    	let t8;
    	let button1;
    	let br2;
    	let t10;
    	let button2;
    	let t11;
    	let button2_disabled_value;
    	let t12;
    	let div3;
    	let br3;
    	let t13;
    	let label;
    	let input;
    	let t14;
    	let br4;
    	let t15;
    	let a;
    	let t17;
    	let br5;
    	let t18;
    	let if_block1_anchor;
    	let mounted;
    	let dispose;

    	function select_block_type_5(ctx, dirty) {
    		if (/*fighting*/ ctx[9]) return create_if_block_5;
    		return create_else_block_4;
    	}

    	let current_block_type = select_block_type_5(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*debug*/ ctx[5] && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text(/*status*/ ctx[3]);
    			t1 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = text(" vs\n          ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			div4 = element("div");
    			div2 = element("div");
    			br0 = element("br");
    			t6 = space();
    			button0 = element("button");
    			if_block0.c();
    			t7 = space();
    			br1 = element("br");
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Stop";
    			br2 = element("br");
    			t10 = space();
    			button2 = element("button");
    			t11 = text("Edit");
    			t12 = space();
    			div3 = element("div");
    			br3 = element("br");
    			t13 = space();
    			label = element("label");
    			input = element("input");
    			t14 = text("\n            Debug");
    			br4 = element("br");
    			t15 = space();
    			a = element("a");
    			a.textContent = "Logs";
    			t17 = space();
    			br5 = element("br");
    			t18 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			add_location(h3, file, 379, 8, 11607);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 378, 6, 11581);
    			attr_dev(span0, "id", "yellow");
    			attr_dev(span0, "class", "svelte-1fcsikx");
    			add_location(span0, file, 383, 10, 11685);
    			attr_dev(span1, "id", "red");
    			attr_dev(span1, "class", "svelte-1fcsikx");
    			add_location(span1, file, 384, 10, 11745);
    			add_location(h1, file, 382, 8, 11670);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file, 381, 6, 11644);
    			add_location(br0, file, 389, 10, 11905);
    			attr_dev(button0, "id", "fight");
    			add_location(button0, file, 390, 10, 11922);
    			add_location(br1, file, 393, 10, 12042);
    			add_location(button1, file, 394, 10, 12059);
    			add_location(br2, file, 400, 11, 12231);
    			attr_dev(button2, "id", "edit");
    			button2.disabled = button2_disabled_value = /*myBots*/ ctx[12].length == 0;
    			add_location(button2, file, 401, 10, 12248);
    			attr_dev(div2, "class", "column column-left column-offset");
    			add_location(div2, file, 388, 8, 11848);
    			add_location(br3, file, 406, 10, 12417);
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file, 408, 12, 12454);
    			add_location(br4, file, 409, 17, 12518);
    			attr_dev(a, "href", "https://apigcp.nimbella.io/wb/?command=activation+list");
    			attr_dev(a, "target", "workbench");
    			add_location(a, file, 410, 12, 12537);
    			add_location(label, file, 407, 10, 12434);
    			add_location(br5, file, 414, 18, 12689);
    			attr_dev(div3, "class", "column column-right");
    			add_location(div3, file, 405, 8, 12373);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file, 387, 6, 11822);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(h1, span0);
    			append_dev(span0, t2);
    			append_dev(h1, t3);
    			append_dev(h1, span1);
    			append_dev(span1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, br0);
    			append_dev(div2, t6);
    			append_dev(div2, button0);
    			if_block0.m(button0, null);
    			append_dev(div2, t7);
    			append_dev(div2, br1);
    			append_dev(div2, t8);
    			append_dev(div2, button1);
    			append_dev(div2, br2);
    			append_dev(div2, t10);
    			append_dev(div2, button2);
    			append_dev(button2, t11);
    			append_dev(div4, t12);
    			append_dev(div4, div3);
    			append_dev(div3, br3);
    			append_dev(div3, t13);
    			append_dev(div3, label);
    			append_dev(label, input);
    			input.checked = /*debug*/ ctx[5];
    			append_dev(label, t14);
    			append_dev(label, br4);
    			append_dev(label, t15);
    			append_dev(label, a);
    			append_dev(label, t17);
    			append_dev(div3, br5);
    			insert_dev(target, t18, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*toggle*/ ctx[28], false, false, false),
    					listen_dev(button1, "click", /*click_handler*/ ctx[38], false, false, false),
    					listen_dev(button2, "click", /*edit*/ ctx[26], false, false, false),
    					listen_dev(input, "change", /*input_change_handler*/ ctx[39])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*status*/ 8) set_data_dev(t0, /*status*/ ctx[3]);
    			if (dirty[0] & /*battle*/ 2 && t2_value !== (t2_value = /*battle*/ ctx[1].robotName(0) + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*battle*/ 2 && t4_value !== (t4_value = /*battle*/ ctx[1].robotName(1) + "")) set_data_dev(t4, t4_value);

    			if (current_block_type !== (current_block_type = select_block_type_5(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			}

    			if (dirty[0] & /*myBots*/ 4096 && button2_disabled_value !== (button2_disabled_value = /*myBots*/ ctx[12].length == 0)) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}

    			if (dirty[0] & /*debug*/ 32) {
    				input.checked = /*debug*/ ctx[5];
    			}

    			if (/*debug*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div4);
    			if_block0.d();
    			if (detaching) detach_dev(t18);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(378:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (277:4) {#if !ready}
    function create_if_block(ctx) {
    	let div0;
    	let h3;
    	let t1;
    	let div3;
    	let div1;
    	let label0;
    	let t2;
    	let input0;
    	let t3;
    	let label1;
    	let t5;
    	let select0;
    	let t6;
    	let div2;
    	let label2;
    	let t7;
    	let input1;
    	let t8;
    	let label3;
    	let t10;
    	let select1;
    	let t11;
    	let div6;
    	let div4;
    	let t12;
    	let div5;
    	let button;
    	let t13;
    	let button_disabled_value;
    	let t14;
    	let if_block2_anchor;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*myBots*/ ctx[12].length == 0) return create_if_block_3;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block0 = current_block_type(ctx);
    	let each_value = /*filteredRedBots*/ ctx[17];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function select_block_type_3(ctx, dirty) {
    		if (/*$ow*/ ctx[18] === undefined) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type_1 = select_block_type_3(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_4(ctx, dirty) {
    		if (/*$ow*/ ctx[18] === undefined) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type_2 = select_block_type_4(ctx);
    	let if_block2 = current_block_type_2(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Make Your Choice";
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			t2 = text("Filter Yellow Fighters: ");
    			input0 = element("input");
    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "Yellow Fighter (You)";
    			t5 = space();
    			select0 = element("select");
    			if_block0.c();
    			t6 = space();
    			div2 = element("div");
    			label2 = element("label");
    			t7 = text("Filter Red Fighters: ");
    			input1 = element("input");
    			t8 = space();
    			label3 = element("label");
    			label3.textContent = "Red Fighter (Enemy)";
    			t10 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t11 = space();
    			div6 = element("div");
    			div4 = element("div");
    			if_block1.c();
    			t12 = space();
    			div5 = element("div");
    			button = element("button");
    			t13 = text("Start the Battle");
    			t14 = space();
    			if_block2.c();
    			if_block2_anchor = empty();
    			add_location(h3, file, 278, 8, 8308);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 277, 6, 8282);
    			add_location(input0, file, 283, 37, 8480);
    			add_location(label0, file, 282, 10, 8436);
    			attr_dev(label1, "for", "mybot");
    			add_location(label1, file, 288, 10, 8614);
    			attr_dev(select0, "id", "enemy");
    			if (/*myBot*/ ctx[7] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[33].call(select0));
    			add_location(select0, file, 289, 10, 8672);
    			attr_dev(div1, "class", "column column-left column-offset");
    			add_location(div1, file, 281, 8, 8379);
    			add_location(input1, file, 307, 34, 9299);
    			add_location(label2, file, 306, 10, 9258);
    			attr_dev(label3, "for", "enemy");
    			add_location(label3, file, 312, 10, 9432);
    			attr_dev(select1, "id", "enemy");
    			if (/*enemyBot*/ ctx[8] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[35].call(select1));
    			add_location(select1, file, 313, 10, 9489);
    			attr_dev(div2, "class", "column column-right");
    			add_location(div2, file, 305, 8, 9214);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file, 280, 6, 8353);
    			attr_dev(div4, "class", "column column-left column-offset");
    			add_location(div4, file, 321, 8, 9738);
    			attr_dev(button, "id", "done");
    			button.disabled = button_disabled_value = !/*canStartBattle*/ ctx[21];
    			add_location(button, file, 333, 10, 10183);
    			attr_dev(div5, "class", "column column-right");
    			add_location(div5, file, 332, 8, 10139);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file, 320, 6, 9712);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h3);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, label0);
    			append_dev(label0, t2);
    			append_dev(label0, input0);
    			set_input_value(input0, /*searchCyanBot*/ ctx[13]);
    			append_dev(div1, t3);
    			append_dev(div1, label1);
    			append_dev(div1, t5);
    			append_dev(div1, select0);
    			if_block0.m(select0, null);
    			select_option(select0, /*myBot*/ ctx[7]);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, label2);
    			append_dev(label2, t7);
    			append_dev(label2, input1);
    			set_input_value(input1, /*searchRedBot*/ ctx[14]);
    			append_dev(div2, t8);
    			append_dev(div2, label3);
    			append_dev(div2, t10);
    			append_dev(div2, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*enemyBot*/ ctx[8]);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div4);
    			if_block1.m(div4, null);
    			append_dev(div6, t12);
    			append_dev(div6, div5);
    			append_dev(div5, button);
    			append_dev(button, t13);
    			insert_dev(target, t14, anchor);
    			if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[32]),
    					listen_dev(input0, "input", /*updateSelectList*/ ctx[24], false, false, false),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[33]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[34]),
    					listen_dev(input1, "input", /*updateSelectList*/ ctx[24], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[35]),
    					listen_dev(button, "click", /*selected*/ ctx[27], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*searchCyanBot*/ 8192 && input0.value !== /*searchCyanBot*/ ctx[13]) {
    				set_input_value(input0, /*searchCyanBot*/ ctx[13]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(select0, null);
    				}
    			}

    			if (dirty[0] & /*myBot, filteredCyanBots, filteredMyBots*/ 98432) {
    				select_option(select0, /*myBot*/ ctx[7]);
    			}

    			if (dirty[0] & /*searchRedBot*/ 16384 && input1.value !== /*searchRedBot*/ ctx[14]) {
    				set_input_value(input1, /*searchRedBot*/ ctx[14]);
    			}

    			if (dirty[0] & /*filteredRedBots*/ 131072) {
    				each_value = /*filteredRedBots*/ ctx[17];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*enemyBot, filteredRedBots*/ 131328) {
    				select_option(select1, /*enemyBot*/ ctx[8]);
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_3(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div4, null);
    				}
    			}

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_4(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div6);
    			if_block1.d();
    			if (detaching) detach_dev(t14);
    			if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(277:4) {#if !ready}",
    		ctx
    	});

    	return block;
    }

    // (392:33) {:else}
    function create_else_block_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Fight!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4.name,
    		type: "else",
    		source: "(392:33) {:else}",
    		ctx
    	});

    	return block;
    }

    // (392:12) {#if fighting}
    function create_if_block_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Suspend");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(392:12) {#if fighting}",
    		ctx
    	});

    	return block;
    }

    // (418:6) {#if debug}
    function create_if_block_4(ctx) {
    	let div2;
    	let div0;
    	let button;
    	let t1;
    	let div1;
    	let t2;
    	let label0;
    	let input0;
    	let t3;
    	let t4;
    	let label1;
    	let input1;
    	let t5;
    	let t6;
    	let label2;
    	let input2;
    	let t7;
    	let t8;
    	let t9;
    	let div4;
    	let div3;
    	let b0;
    	let t10;
    	let t11_value = /*$inspector*/ ctx[20][0].state + "";
    	let t11;
    	let br0;
    	let t12;
    	let b1;
    	let t14;
    	let t15_value = /*$inspector*/ ctx[20][0].n + "";
    	let t15;
    	let t16;
    	let pre0;
    	let t17_value = /*$inspector*/ ctx[20][0].req + "";
    	let t17;
    	let br1;
    	let b2;
    	let t18_value = /*$inspector*/ ctx[20][0].res + "";
    	let t18;
    	let t19;
    	let b3;
    	let t20;
    	let t21_value = /*$inspector*/ ctx[20][1].state + "";
    	let t21;
    	let br2;
    	let t22;
    	let b4;
    	let t24;
    	let t25_value = /*$inspector*/ ctx[20][1].n + "";
    	let t25;
    	let t26;
    	let pre1;
    	let t27_value = /*$inspector*/ ctx[20][1].req + "";
    	let t27;
    	let br3;
    	let b5;
    	let t28_value = /*$inspector*/ ctx[20][1].res + "";
    	let t28;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "Trace";
    			t1 = space();
    			div1 = element("div");
    			t2 = text("Trace: \n            ");
    			label0 = element("label");
    			input0 = element("input");
    			t3 = text("\n              Events ");
    			t4 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t5 = text("\n              Requests ");
    			t6 = space();
    			label2 = element("label");
    			input2 = element("input");
    			t7 = text("\n              Actions ");
    			t8 = text("\n            (open console)");
    			t9 = space();
    			div4 = element("div");
    			div3 = element("div");
    			b0 = element("b");
    			t10 = text("[Me] ");
    			t11 = text(t11_value);
    			br0 = element("br");
    			t12 = text("\n            Request/");
    			b1 = element("b");
    			b1.textContent = "Response";
    			t14 = text("\n            #");
    			t15 = text(t15_value);
    			t16 = space();
    			pre0 = element("pre");
    			t17 = text(t17_value);
    			br1 = element("br");
    			b2 = element("b");
    			t18 = text(t18_value);
    			t19 = space();
    			b3 = element("b");
    			t20 = text("[Emeny] ");
    			t21 = text(t21_value);
    			br2 = element("br");
    			t22 = text("\n            Request/");
    			b4 = element("b");
    			b4.textContent = "Response";
    			t24 = text("\n            #");
    			t25 = text(t25_value);
    			t26 = space();
    			pre1 = element("pre");
    			t27 = text(t27_value);
    			br3 = element("br");
    			b5 = element("b");
    			t28 = text(t28_value);
    			attr_dev(button, "id", "step");
    			add_location(button, file, 420, 12, 12837);
    			attr_dev(div0, "class", "column column-left column-offset");
    			add_location(div0, file, 419, 10, 12778);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file, 425, 14, 13007);
    			add_location(label0, file, 424, 12, 12985);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file, 429, 14, 13142);
    			add_location(label1, file, 428, 12, 13120);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file, 433, 14, 13281);
    			add_location(label2, file, 432, 12, 13259);
    			attr_dev(div1, "class", "column column-right");
    			add_location(div1, file, 422, 10, 12914);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file, 418, 8, 12750);
    			add_location(b0, file, 441, 12, 13536);
    			add_location(br0, file, 441, 45, 13569);
    			add_location(b1, file, 442, 20, 13596);
    			add_location(br1, file, 444, 36, 13679);
    			add_location(b2, file, 444, 42, 13685);
    			add_location(pre0, file, 444, 12, 13655);
    			add_location(b3, file, 446, 12, 13745);
    			add_location(br2, file, 446, 48, 13781);
    			add_location(b4, file, 447, 20, 13808);
    			add_location(br3, file, 449, 36, 13891);
    			add_location(b5, file, 449, 42, 13897);
    			add_location(pre1, file, 449, 12, 13867);
    			attr_dev(div3, "class", "column column-50 column-offset");
    			add_location(div3, file, 440, 10, 13479);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file, 439, 8, 13451);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, button);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, label0);
    			append_dev(label0, input0);
    			input0.checked = /*log*/ ctx[0].eventOn;
    			append_dev(label0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, label1);
    			append_dev(label1, input1);
    			input1.checked = /*log*/ ctx[0].requestOn;
    			append_dev(label1, t5);
    			append_dev(div1, t6);
    			append_dev(div1, label2);
    			append_dev(label2, input2);
    			input2.checked = /*log*/ ctx[0].actionOn;
    			append_dev(label2, t7);
    			append_dev(div1, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, b0);
    			append_dev(b0, t10);
    			append_dev(b0, t11);
    			append_dev(div3, br0);
    			append_dev(div3, t12);
    			append_dev(div3, b1);
    			append_dev(div3, t14);
    			append_dev(div3, t15);
    			append_dev(div3, t16);
    			append_dev(div3, pre0);
    			append_dev(pre0, t17);
    			append_dev(pre0, br1);
    			append_dev(pre0, b2);
    			append_dev(b2, t18);
    			append_dev(div3, t19);
    			append_dev(div3, b3);
    			append_dev(b3, t20);
    			append_dev(b3, t21);
    			append_dev(div3, br2);
    			append_dev(div3, t22);
    			append_dev(div3, b4);
    			append_dev(div3, t24);
    			append_dev(div3, t25);
    			append_dev(div3, t26);
    			append_dev(div3, pre1);
    			append_dev(pre1, t27);
    			append_dev(pre1, br3);
    			append_dev(pre1, b5);
    			append_dev(b5, t28);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*trace*/ ctx[25], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[40]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[41]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[42])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*log*/ 1) {
    				input0.checked = /*log*/ ctx[0].eventOn;
    			}

    			if (dirty[0] & /*log*/ 1) {
    				input1.checked = /*log*/ ctx[0].requestOn;
    			}

    			if (dirty[0] & /*log*/ 1) {
    				input2.checked = /*log*/ ctx[0].actionOn;
    			}

    			if (dirty[0] & /*$inspector*/ 1048576 && t11_value !== (t11_value = /*$inspector*/ ctx[20][0].state + "")) set_data_dev(t11, t11_value);
    			if (dirty[0] & /*$inspector*/ 1048576 && t15_value !== (t15_value = /*$inspector*/ ctx[20][0].n + "")) set_data_dev(t15, t15_value);
    			if (dirty[0] & /*$inspector*/ 1048576 && t17_value !== (t17_value = /*$inspector*/ ctx[20][0].req + "")) set_data_dev(t17, t17_value);
    			if (dirty[0] & /*$inspector*/ 1048576 && t18_value !== (t18_value = /*$inspector*/ ctx[20][0].res + "")) set_data_dev(t18, t18_value);
    			if (dirty[0] & /*$inspector*/ 1048576 && t21_value !== (t21_value = /*$inspector*/ ctx[20][1].state + "")) set_data_dev(t21, t21_value);
    			if (dirty[0] & /*$inspector*/ 1048576 && t25_value !== (t25_value = /*$inspector*/ ctx[20][1].n + "")) set_data_dev(t25, t25_value);
    			if (dirty[0] & /*$inspector*/ 1048576 && t27_value !== (t27_value = /*$inspector*/ ctx[20][1].req + "")) set_data_dev(t27, t27_value);
    			if (dirty[0] & /*$inspector*/ 1048576 && t28_value !== (t28_value = /*$inspector*/ ctx[20][1].res + "")) set_data_dev(t28, t28_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(418:6) {#if debug}",
    		ctx
    	});

    	return block;
    }

    // (295:12) {:else}
    function create_else_block_2(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*filteredMyBots*/ ctx[16];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredMyBots, $rewards*/ 589824) {
    				each_value_2 = /*filteredMyBots*/ ctx[16];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(295:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (291:12) {#if myBots.length == 0}
    function create_if_block_3(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*filteredCyanBots*/ ctx[15];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredCyanBots*/ 32768) {
    				each_value_1 = /*filteredCyanBots*/ ctx[15];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(291:12) {#if myBots.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (296:14) {#each filteredMyBots as bot}
    function create_each_block_2(ctx) {
    	let option;
    	let t0_value = /*bot*/ ctx[62].split(".")[0] + "";
    	let t0;

    	let t1_value = (/*$rewards*/ ctx[19] > 0
    	? " (+" + /*$rewards*/ ctx[19] + ")"
    	: "") + "";

    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			option.__value = option_value_value = /*bot*/ ctx[62];
    			option.value = option.__value;
    			add_location(option, file, 296, 16, 8962);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredMyBots*/ 65536 && t0_value !== (t0_value = /*bot*/ ctx[62].split(".")[0] + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*$rewards*/ 524288 && t1_value !== (t1_value = (/*$rewards*/ ctx[19] > 0
    			? " (+" + /*$rewards*/ ctx[19] + ")"
    			: "") + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*filteredMyBots*/ 65536 && option_value_value !== (option_value_value = /*bot*/ ctx[62])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(296:14) {#each filteredMyBots as bot}",
    		ctx
    	});

    	return block;
    }

    // (292:14) {#each filteredCyanBots as enemy}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*enemy*/ ctx[57].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*enemy*/ ctx[57].url;
    			option.value = option.__value;
    			add_location(option, file, 292, 16, 8812);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredCyanBots*/ 32768 && t_value !== (t_value = /*enemy*/ ctx[57].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*filteredCyanBots*/ 32768 && option_value_value !== (option_value_value = /*enemy*/ ctx[57].url)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(292:14) {#each filteredCyanBots as enemy}",
    		ctx
    	});

    	return block;
    }

    // (315:12) {#each filteredRedBots as enemy}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*enemy*/ ctx[57].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*enemy*/ ctx[57].url;
    			option.value = option.__value;
    			add_location(option, file, 315, 14, 9590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredRedBots*/ 131072 && t_value !== (t_value = /*enemy*/ ctx[57].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*filteredRedBots*/ 131072 && option_value_value !== (option_value_value = /*enemy*/ ctx[57].url)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(315:12) {#each filteredRedBots as enemy}",
    		ctx
    	});

    	return block;
    }

    // (325:10) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let button;
    	let t;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text("Edit my Fighter");
    			attr_dev(button, "id", "edit");
    			button.disabled = button_disabled_value = /*myBots*/ ctx[12].length == 0;
    			add_location(button, file, 326, 14, 9960);
    			attr_dev(div, "class", "column column-right");
    			add_location(div, file, 325, 12, 9912);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*edit*/ ctx[26], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*myBots*/ 4096 && button_disabled_value !== (button_disabled_value = /*myBots*/ ctx[12].length == 0)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(325:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (323:10) {#if $ow === undefined}
    function create_if_block_2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Login";
    			attr_dev(button, "id", "login");
    			add_location(button, file, 323, 12, 9831);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*login*/ ctx[22], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(323:10) {#if $ow === undefined}",
    		ctx
    	});

    	return block;
    }

    // (350:6) {:else}
    function create_else_block(ctx) {
    	let div2;
    	let div0;
    	let button;
    	let t1;
    	let div1;
    	let input;
    	let t2;
    	let div5;
    	let div3;
    	let t4;
    	let div4;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t8;
    	let h4;
    	let t9;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "Create New Fighter";
    			t1 = space();
    			div1 = element("div");
    			input = element("input");
    			t2 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div3.textContent = "Programming Language:";
    			t4 = space();
    			div4 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "JavaScript";
    			option1 = element("option");
    			option1.textContent = "Python";
    			option2 = element("option");
    			option2.textContent = "Golang";
    			t8 = space();
    			h4 = element("h4");
    			t9 = text(/*extra*/ ctx[6]);
    			attr_dev(button, "id", "create");
    			add_location(button, file, 352, 12, 10777);
    			attr_dev(div0, "class", "column column-left column-offset");
    			add_location(div0, file, 351, 10, 10718);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "robot name");
    			attr_dev(input, "id", "botname");
    			add_location(input, file, 355, 12, 10916);
    			attr_dev(div1, "class", "column column-right");
    			add_location(div1, file, 354, 10, 10870);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file, 350, 8, 10690);
    			attr_dev(div3, "class", "column column-left column-offset");
    			add_location(div3, file, 364, 10, 11135);
    			option0.__value = "js";
    			option0.value = option0.__value;
    			add_location(option0, file, 369, 14, 11335);
    			option1.__value = "py";
    			option1.value = option1.__value;
    			add_location(option1, file, 370, 14, 11388);
    			option2.__value = "go";
    			option2.value = option2.__value;
    			add_location(option2, file, 371, 14, 11437);
    			if (/*robotType*/ ctx[11] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[37].call(select));
    			add_location(select, file, 368, 12, 11289);
    			attr_dev(div4, "class", "column column-right");
    			add_location(div4, file, 367, 10, 11243);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file, 363, 8, 11107);
    			add_location(h4, file, 375, 8, 11534);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, button);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*robotName*/ ctx[10]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*robotType*/ ctx[11]);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*create*/ ctx[23], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[36]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[37])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*robotName*/ 1024 && input.value !== /*robotName*/ ctx[10]) {
    				set_input_value(input, /*robotName*/ ctx[10]);
    			}

    			if (dirty[0] & /*robotType*/ 2048) {
    				select_option(select, /*robotType*/ ctx[11]);
    			}

    			if (dirty[0] & /*extra*/ 64) set_data_dev(t9, /*extra*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(h4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(350:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (339:6) {#if $ow === undefined}
    function create_if_block_1(ctx) {
    	let div1;
    	let div0;
    	let h4;
    	let t0;
    	let b;
    	let t2;
    	let t3;
    	let t4;
    	let br0;
    	let t5;
    	let a;
    	let t7;
    	let br1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text("Welcome to\n              ");
    			b = element("b");
    			b.textContent = "FAAS Wars";
    			t2 = text("\n              v");
    			t3 = text(VERSION);
    			t4 = text(".");
    			br0 = element("br");
    			t5 = text("Please check the\n              ");
    			a = element("a");
    			a.textContent = "License";
    			t7 = text(".");
    			br1 = element("br");
    			add_location(b, file, 343, 14, 10497);
    			add_location(br0, file, 344, 25, 10539);
    			attr_dev(a, "href", "license.html");
    			add_location(a, file, 345, 14, 10576);
    			add_location(br1, file, 345, 49, 10611);
    			add_location(h4, file, 341, 12, 10453);
    			attr_dev(div0, "class", "column column-center column-offset");
    			add_location(div0, file, 340, 10, 10392);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file, 339, 8, 10364);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(h4, b);
    			append_dev(h4, t2);
    			append_dev(h4, t3);
    			append_dev(h4, t4);
    			append_dev(h4, br0);
    			append_dev(h4, t5);
    			append_dev(h4, a);
    			append_dev(h4, t7);
    			append_dev(h4, br1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(339:6) {#if $ow === undefined}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let section;
    	let div0;
    	let t0;
    	let div1;
    	let canvas;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*msg*/ ctx[2] == "") return create_if_block_6;
    		return create_else_block_5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*ready*/ ctx[4]) return create_if_block;
    		return create_else_block_3;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			section = element("section");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			canvas = element("canvas");
    			t1 = space();
    			if_block1.c();
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 261, 4, 7920);
    			attr_dev(canvas, "id", "arena");
    			attr_dev(canvas, "width", "500");
    			attr_dev(canvas, "height", "500");
    			attr_dev(canvas, "class", "svelte-1fcsikx");
    			add_location(canvas, file, 274, 21, 8205);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file, 274, 4, 8188);
    			attr_dev(section, "class", "container");
    			add_location(section, file, 260, 2, 7888);
    			attr_dev(main, "class", "wrapper");
    			add_location(main, file, 259, 0, 7863);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section);
    			append_dev(section, div0);
    			if_block0.m(div0, null);
    			append_dev(section, t0);
    			append_dev(section, div1);
    			append_dev(div1, canvas);
    			append_dev(section, t1);
    			if_block1.m(section, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(section, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function check(r) {
    	if (r.ok) return r.json(); else {
    		console.log(r);
    	}
    }

    function instance($$self, $$props, $$invalidate) {
    	let $ow;
    	let $rewards;
    	let $inspector;
    	validate_store(ow, "ow");
    	component_subscribe($$self, ow, $$value => $$invalidate(18, $ow = $$value));
    	validate_store(rewards, "rewards");
    	component_subscribe($$self, rewards, $$value => $$invalidate(19, $rewards = $$value));
    	validate_store(inspector, "inspector");
    	component_subscribe($$self, inspector, $$value => $$invalidate(20, $inspector = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Field", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let { base } = $$props;
    	let { apihost } = $$props;
    	let { namespace } = $$props;
    	let battle;
    	let msg = $ow === undefined ? "" : "Choose opponents";
    	let status = "Select Opponents";
    	let ready = false;
    	let debug = false;
    	let extra = "";
    	let myBot;
    	let enemyBot;
    	let fighting = false;
    	let editing = false;
    	let robotName = "";
    	let robotType = "js";
    	let myBots = [];
    	let enemyBots = [];
    	let cyanBots = enemyBots;
    	let redBots = enemyBots;
    	let searchCyanBot = "";
    	let searchRedBot = "";
    	let filteredCyanBots = cyanBots;
    	let filteredMyBots = myBots;
    	let filteredRedBots = redBots;
    	let canStartBattle = true;

    	let robotMap = {
    		js: base + "/src/JsBot.js",
    		go: base + "/src/GoBot.go",
    		py: base + "/src/PyBot.py"
    	};

    	let regex = /^\w{1,60}$/g;

    	function login() {
    		let url = base + "/login";
    		let password = "s3cr3t"; //prompt("Password:")
    		console.log(url);

    		fetch(url, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ password })
    		}).then(check).then(r => {
    			console.log(r);

    			if ("error" in r) {
    				alert(r.error);
    			} else {
    				if ("token" in r) {
    					ow.set(new OpenWhisk(apihost, r["token"], namespace));
    					window["ow"] = $ow;
    					updateBots();
    				}
    			}
    		}).catch(ex => {
    			console.log(ex);
    			alert("Unexpected error - check logs");
    		});
    	}

    	function create() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (!robotName.match(regex)) {
    				alert("Invalid Robot Name");
    				return false;
    			}

    			let bot;

    			return fetch(robotMap[robotType]).then(data => {
    				if (data.ok) return data.text();
    				throw data.statusText;
    			}).then(code => {
    				bot = robotName + "." + robotType;
    				return $ow.save(bot, code, false);
    			}).then(result => __awaiter(this, void 0, void 0, function* () {
    				console.log(result);
    				if ("error" in result) throw result["error"];
    				source.set(bot);
    				return true;
    			})).catch(err => {
    				alert(err);
    				return false;
    			});
    		});
    	}

    	function updateBots() {
    		return __awaiter(this, void 0, void 0, function* () {
    			enemyBots = yield rumblePublic();

    			for (let i = 0; i < enemyBots.length; i++) {
    				let bot = enemyBots[i];
    				enemyBots[i].url = bot.url + ":" + bot.rewards;
    				enemyBots[i].name = bot.name + (bot.rewards > 0 ? " (+" + bot.rewards + ")" : "");
    			}

    			cyanBots = Object.assign([], enemyBots);
    			cyanBots.sort(() => 0.5 - Math.random());
    			redBots = Object.assign([], enemyBots);
    			redBots.sort(() => 0.5 - Math.random());

    			if ($ow !== undefined) {
    				$$invalidate(12, myBots = yield $ow.list());
    			}

    			updateSelectList();
    		});
    	}

    	function updateSelectList() {
    		$$invalidate(15, filteredCyanBots = cyanBots.filter(item => item.name.toLowerCase().indexOf(searchCyanBot.toLowerCase()) !== -1));
    		$$invalidate(16, filteredMyBots = myBots.filter(item => item.toLowerCase().indexOf(searchCyanBot.toLowerCase()) !== -1));
    		$$invalidate(17, filteredRedBots = redBots.filter(item => item.name.toLowerCase().indexOf(searchRedBot.toLowerCase()) !== -1));

    		if (myBots.length > 0) {
    			$$invalidate(7, myBot = filteredMyBots[0]);
    		} else {
    			$$invalidate(7, myBot = filteredCyanBots[0].url);
    		}

    		$$invalidate(8, enemyBot = filteredRedBots[0].url);
    		console.log("updated", myBot, enemyBot);
    	}

    	let unsubscribeSource = source.subscribe(value => {
    		editing = value != "";
    		updateBots();
    	});

    	function finish(winner) {
    		$$invalidate(2, msg = "Game over");

    		if (winner == -2) {
    			image = "ready";
    			$$invalidate(6, extra = "");
    		} else if (winner == -1) {
    			image = "draw";
    			$$invalidate(6, extra = "");
    		} else if (winner == 0) {
    			image = "won";
    			$$invalidate(6, extra = "Great Achievement! Share it with your friends!");
    		} else {
    			image = "lose";
    			$$invalidate(6, extra = "");
    		}

    		$$invalidate(3, status = "Select Opponents");
    		$$invalidate(4, ready = false);
    		$$invalidate(9, fighting = false);
    		battle.stop();
    		inspector.set([{ n: 0, req: "", res: "", state: "" }, { n: 0, req: "", res: "", state: "" }]);
    	}

    	function trace() {
    		$$invalidate(3, status = "Tracing...");
    		$$invalidate(9, fighting = false);
    		$$invalidate(2, msg = battle.trace());
    	}

    	function suspended(msg, state0, state1) {
    		$$invalidate(3, status = msg);
    		$$invalidate(9, fighting = false);

    		inspector.update(info => {
    			info[0].state = state0;
    			info[1].state = state1;
    			return info;
    		});
    	}

    	function edit() {
    		console.log(myBot);
    		source.set(myBot);
    		battle.stop();
    		editing = true;
    	}

    	let image = $ow === undefined ? "splash" : "ready";

    	let Images = new AssetsLoader({
    			splash: "img/splash.png",
    			ready: "img/ready.png",
    			lose: "img/lose.png",
    			won: "img/won.png",
    			draw: "img/draw.png"
    		});

    	function splash() {
    		//console.log("splash")
    		let canvas = document.getElementById("arena");

    		let ctx = canvas.getContext("2d");
    		ctx.clearRect(0, 0, 500, 500);
    		ctx.drawImage(Images.get(image), 0, 0);
    	}

    	afterUpdate(() => {
    		if (!(editing || ready)) splash();
    	});

    	function selected() {
    		console.log("mybot", myBot);
    		console.log("enemybot", enemyBot);

    		let champ = myBots.length == 0
    		? myBot.split(":")[0]
    		: $ow.namespace + "/default/" + myBot.split(".")[0];

    		let champExtra = myBots.length == 0
    		? parseInt(myBot.split(":")[1])
    		: $rewards;

    		let enemy = enemyBot.split(":")[0];
    		let enemyExtra = parseInt(enemyBot.split(":")[1]);
    		let urls = [URL_BASE + champ, URL_BASE + enemy];
    		let canvas = document.getElementById("arena");

    		let startAngles = [
    			[Math.random() * 360, Math.random() * 360],
    			[Math.random() * 360, Math.random() * 360]
    		];

    		let startLives = [champExtra, enemyExtra];
    		battle.webinit(canvas.getContext("2d"), urls, startAngles, startLives);
    		$$invalidate(4, ready = true);
    		$$invalidate(2, msg = "May the FAAS be with you!");
    		$$invalidate(3, status = "Fighting!");
    		$$invalidate(9, fighting = true);
    		battle.draw();
    		battle.start();
    	}

    	function toggle() {
    		$$invalidate(9, fighting = !fighting);

    		if (fighting) {
    			$$invalidate(3, status = "Fighting!");
    			battle.start();
    		} else {
    			$$invalidate(3, status = "Suspended...");
    			battle.stop();
    		}
    	}

    	onMount(() => {
    		let canvas = document.getElementById("arena");
    		$$invalidate(1, battle = new BattleWeb(parseInt(canvas.getAttribute("width")), parseInt(canvas.getAttribute("height")), finish, suspended));
    		updateBots();
    		Images.loadAll(() => splash());
    	});

    	onDestroy(unsubscribeSource);
    	const writable_props = ["base", "apihost", "namespace"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Field> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		searchCyanBot = this.value;
    		$$invalidate(13, searchCyanBot);
    	}

    	function select0_change_handler() {
    		myBot = select_value(this);
    		$$invalidate(7, myBot);
    		$$invalidate(15, filteredCyanBots);
    		$$invalidate(16, filteredMyBots);
    	}

    	function input1_input_handler() {
    		searchRedBot = this.value;
    		$$invalidate(14, searchRedBot);
    	}

    	function select1_change_handler() {
    		enemyBot = select_value(this);
    		$$invalidate(8, enemyBot);
    		$$invalidate(17, filteredRedBots);
    	}

    	function input_input_handler() {
    		robotName = this.value;
    		$$invalidate(10, robotName);
    	}

    	function select_change_handler() {
    		robotType = select_value(this);
    		$$invalidate(11, robotType);
    	}

    	const click_handler = () => {
    		$$invalidate(4, ready = false);
    		$$invalidate(9, fighting = false);
    		battle.terminate();
    	};

    	function input_change_handler() {
    		debug = this.checked;
    		$$invalidate(5, debug);
    	}

    	function input0_change_handler() {
    		log.eventOn = this.checked;
    		$$invalidate(0, log);
    	}

    	function input1_change_handler() {
    		log.requestOn = this.checked;
    		$$invalidate(0, log);
    	}

    	function input2_change_handler() {
    		log.actionOn = this.checked;
    		$$invalidate(0, log);
    	}

    	$$self.$$set = $$props => {
    		if ("base" in $$props) $$invalidate(29, base = $$props.base);
    		if ("apihost" in $$props) $$invalidate(30, apihost = $$props.apihost);
    		if ("namespace" in $$props) $$invalidate(31, namespace = $$props.namespace);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		OpenWhisk,
    		URL_BASE,
    		VERSION,
    		BattleWeb,
    		AssetsLoader,
    		onMount,
    		afterUpdate,
    		onDestroy,
    		inspector,
    		source,
    		rewards,
    		ow,
    		log,
    		rumblePublic,
    		base,
    		apihost,
    		namespace,
    		battle,
    		msg,
    		status,
    		ready,
    		debug,
    		extra,
    		myBot,
    		enemyBot,
    		fighting,
    		editing,
    		robotName,
    		robotType,
    		myBots,
    		enemyBots,
    		cyanBots,
    		redBots,
    		searchCyanBot,
    		searchRedBot,
    		filteredCyanBots,
    		filteredMyBots,
    		filteredRedBots,
    		canStartBattle,
    		robotMap,
    		regex,
    		check,
    		login,
    		create,
    		updateBots,
    		updateSelectList,
    		unsubscribeSource,
    		finish,
    		trace,
    		suspended,
    		edit,
    		image,
    		Images,
    		splash,
    		selected,
    		toggle,
    		$ow,
    		$rewards,
    		$inspector
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("base" in $$props) $$invalidate(29, base = $$props.base);
    		if ("apihost" in $$props) $$invalidate(30, apihost = $$props.apihost);
    		if ("namespace" in $$props) $$invalidate(31, namespace = $$props.namespace);
    		if ("battle" in $$props) $$invalidate(1, battle = $$props.battle);
    		if ("msg" in $$props) $$invalidate(2, msg = $$props.msg);
    		if ("status" in $$props) $$invalidate(3, status = $$props.status);
    		if ("ready" in $$props) $$invalidate(4, ready = $$props.ready);
    		if ("debug" in $$props) $$invalidate(5, debug = $$props.debug);
    		if ("extra" in $$props) $$invalidate(6, extra = $$props.extra);
    		if ("myBot" in $$props) $$invalidate(7, myBot = $$props.myBot);
    		if ("enemyBot" in $$props) $$invalidate(8, enemyBot = $$props.enemyBot);
    		if ("fighting" in $$props) $$invalidate(9, fighting = $$props.fighting);
    		if ("editing" in $$props) editing = $$props.editing;
    		if ("robotName" in $$props) $$invalidate(10, robotName = $$props.robotName);
    		if ("robotType" in $$props) $$invalidate(11, robotType = $$props.robotType);
    		if ("myBots" in $$props) $$invalidate(12, myBots = $$props.myBots);
    		if ("enemyBots" in $$props) enemyBots = $$props.enemyBots;
    		if ("cyanBots" in $$props) cyanBots = $$props.cyanBots;
    		if ("redBots" in $$props) redBots = $$props.redBots;
    		if ("searchCyanBot" in $$props) $$invalidate(13, searchCyanBot = $$props.searchCyanBot);
    		if ("searchRedBot" in $$props) $$invalidate(14, searchRedBot = $$props.searchRedBot);
    		if ("filteredCyanBots" in $$props) $$invalidate(15, filteredCyanBots = $$props.filteredCyanBots);
    		if ("filteredMyBots" in $$props) $$invalidate(16, filteredMyBots = $$props.filteredMyBots);
    		if ("filteredRedBots" in $$props) $$invalidate(17, filteredRedBots = $$props.filteredRedBots);
    		if ("canStartBattle" in $$props) $$invalidate(21, canStartBattle = $$props.canStartBattle);
    		if ("robotMap" in $$props) robotMap = $$props.robotMap;
    		if ("regex" in $$props) regex = $$props.regex;
    		if ("unsubscribeSource" in $$props) unsubscribeSource = $$props.unsubscribeSource;
    		if ("image" in $$props) image = $$props.image;
    		if ("Images" in $$props) Images = $$props.Images;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		log,
    		battle,
    		msg,
    		status,
    		ready,
    		debug,
    		extra,
    		myBot,
    		enemyBot,
    		fighting,
    		robotName,
    		robotType,
    		myBots,
    		searchCyanBot,
    		searchRedBot,
    		filteredCyanBots,
    		filteredMyBots,
    		filteredRedBots,
    		$ow,
    		$rewards,
    		$inspector,
    		canStartBattle,
    		login,
    		create,
    		updateSelectList,
    		trace,
    		edit,
    		selected,
    		toggle,
    		base,
    		apihost,
    		namespace,
    		input0_input_handler,
    		select0_change_handler,
    		input1_input_handler,
    		select1_change_handler,
    		input_input_handler,
    		select_change_handler,
    		click_handler,
    		input_change_handler,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler
    	];
    }

    class Field extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { base: 29, apihost: 30, namespace: 31 }, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Field",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*base*/ ctx[29] === undefined && !("base" in props)) {
    			console_1.warn("<Field> was created without expected prop 'base'");
    		}

    		if (/*apihost*/ ctx[30] === undefined && !("apihost" in props)) {
    			console_1.warn("<Field> was created without expected prop 'apihost'");
    		}

    		if (/*namespace*/ ctx[31] === undefined && !("namespace" in props)) {
    			console_1.warn("<Field> was created without expected prop 'namespace'");
    		}
    	}

    	get base() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set base(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get apihost() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apihost(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get namespace() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set namespace(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Doc.svelte generated by Svelte v3.31.0 */

    const file$1 = "src/Doc.svelte";

    function create_fragment$1(ctx) {
    	let div;

    	let raw_value = `
<h1 id="how-to-code-your-fighter">How to code your fighter</h1>
<p>This document is a quick recap of the API. You can also <a href="https://nimbella.com/blog/faas-wars-serverless-virtual-robot-competition?utm_source=subdomain&amp;utm_medium=landing&amp;utm_campaign=faaswars">read this tutorial</a>.</p>
<p>You control your fighter writing a serverless action. <a href="https://github.com/openwhisk-blog/nimbots/tree/master/packages/default">Check here the source code of the sample fighters</a>. You can use the integrated editor to code your fighter but you need to setup an account in Nimbella to play.</p>
<p>A serverless action is a function, written in either Javascript, Python or Go, that receive as input a json document and returns its answer in json. In each programming language the json is serialized and deserialized first in a data structure appropriate for you programming language. When you create a fighter a suitable example is provided.</p>
<p>Each fighter will communicate with the action to receive orders. The action is invoked when an event occurr. In response to an event you return a list of orders, in the format described below.</p>
<p>The fighter has an energy level that starts at 5 and decrease by one each time you are hit. When it reaches <code>0</code> you lose. You lose also if your controlling actions returns an error, so be careful in your coding.</p>
<h2 id="events">Events</h2>
<p>The fighter receive a message in the following format:</p>
<pre><code>{
  &quot;event&quot;: &quot;idle&quot;,
  &quot;energy&quot;: 5,
  &quot;x&quot;: 110,
  &quot;y&quot;: 240,
  &quot;angle&quot;: 23
  &quot;tank_angle&quot;: 232,
  &quot;turret_angle&quot;: 150,
  &quot;enemy_spot&quot;: {},
  &quot;data&quot;: {}
}</code></pre>
<ul>
<li>The <code>event</code> can be:
<ul>
<li><code>idle</code>: the fighter has its order queue empty and and asks for new orders</li>
<li><code>enemy-spot</code>: the fighter has spotted the enemy and can hit him firing</li>
<li><code>hit</code>: the fighter was hit by an enemy bullet</li>
<li><code>wall-collide</code>: the fighter collided with a wall</li>
</ul></li>
<li><code>x</code> and <code>y</code> are the position in the battlefiel,</li>
<li><code>tank_angle</code> and <code>turret_angle</code> are the angles of the tank and of the turret in degrees.</li>
<li><code>angle</code> is the sum of the angle of the turret and the tank, modulo 360</li>
<li><code>energy</code> is your energy level,</li>
</ul>
<p>When the event is <code>enemy_spot</code> there is also the field <code>enemy_spot</code> in this format:</p>
<pre><code>{
    &quot;id&quot;: 1,
    &quot;x&quot;: 291,
    &quot;y&quot;: 180,
    &quot;angle&quot;: 23,
    &quot;distance&quot;: 202,
    &quot;energy&quot;: 1
}</code></pre>
<p>where <code>x</code> and <code>y</code> are the enemy location, <code>angle</code> is the absolute angle to fire him, <code>distance</code> is its distance and <code>energy</code> the enemy energy level.</p>
<p>Lastly the <code>data</code> field is a field that you can set with your own values with the <code>data</code> command, to save a state for further actions.</p>
<h2 id="commands">Commands</h2>
<p>When you receive an event you decide what to do and give orders to the fighter.</p>
<p>The commands are an array of maps. For example:</p>
<pre><code>[{
    &quot;move_forwards&quot;: 50,
    &quot;shoot&quot;: true
 },
 {
  &quot;move_backwards&quot;: 50,
  &quot;turn_turret_right&quot;: 180,
  &quot;shoot&quot;: true
}]</code></pre>
<p>Each map must contains one (and only one) key/value entry describing a sequential action. If you specify more than one sequential action, only one will be executed (and we do not tell you which one, so do not do it!).</p>
<p>The sequential actions are:</p>
<ul>
<li><code>move_forwads: &lt;number&gt;</code>: move forward of the given number of pixels</li>
<li><code>move_backwards: &lt;number&gt;</code>: move backwards of the given number of pixels</li>
<li><code>move_opposide: &lt;number&gt;</code>: move in the opposite direction of where you were moving - useful when you hit a wall</li>
<li><code>turn_left: &lt;number&gt;</code>: turn the tanks to the left of the given angle in degrees</li>
<li><code>turn_right: &lt;number&gt;</code>: turn the tanks to the right of the given angle in degrees</li>
</ul>
<p>For each sequential action you can also specify a parallel action, that is done at the same time as the sequential (that is: the tank can fire and move the turret while it is moving in a given direction)</p>
<p>The parallel actions are:</p>
<ul>
<li><code>turn_turret_left: &lt;number&gt;</code>: turn the turret to the left of the given angle in degrees</li>
<li><code>turn_turret_right: &lt;number&gt;</code>: turn the turret to the right of the given angle in degrees</li>
<li><code>shot: true</code>: fires a bullet; note you can fire up to 5 bullets at the same time</li>
<li><code>yell: &lt;string&gt;</code>: yell a message that will be displayed in the battle field</li>
</ul>
` + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "column column-center column-offset");
    			add_location(div, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Doc", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Doc> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Doc extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Doc",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Editor.svelte generated by Svelte v3.31.0 */

    const { console: console_1$1 } = globals;
    const file$2 = "src/Editor.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let section;
    	let div0;
    	let iframe;
    	let iframe_src_value;
    	let t0;
    	let br;
    	let t1;
    	let div3;
    	let div1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let div2;
    	let h3;
    	let tt;
    	let t8;
    	let t9;
    	let div4;
    	let doc;
    	let current;
    	let mounted;
    	let dispose;
    	doc = new Doc({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			section = element("section");
    			div0 = element("div");
    			iframe = element("iframe");
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Save";
    			t3 = text("\n         \n        ");
    			button1 = element("button");
    			button1.textContent = "Cancel";
    			t5 = text("\n         \n        ");
    			button2 = element("button");
    			button2.textContent = "Delete";
    			t7 = space();
    			div2 = element("div");
    			h3 = element("h3");
    			tt = element("tt");
    			t8 = text(/*$source*/ ctx[0]);
    			t9 = space();
    			div4 = element("div");
    			create_component(doc.$$.fragment);
    			attr_dev(iframe, "title", "editor");
    			attr_dev(iframe, "id", "editor");
    			if (iframe.src !== (iframe_src_value = "editor.html")) attr_dev(iframe, "src", iframe_src_value);
    			set_style(iframe, "height", "500px");
    			set_style(iframe, "width", "100%");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "scrolling", "no");
    			add_location(iframe, file$2, 63, 6, 2345);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$2, 62, 4, 2321);
    			add_location(br, file$2, 73, 4, 2560);
    			attr_dev(button0, "id", "done");
    			add_location(button0, file$2, 77, 8, 2672);
    			attr_dev(button1, "id", "done");
    			add_location(button1, file$2, 79, 8, 2743);
    			attr_dev(button2, "id", "done");
    			add_location(button2, file$2, 81, 8, 2818);
    			attr_dev(div1, "class", "float-left");
    			add_location(div1, file$2, 76, 6, 2639);
    			add_location(tt, file$2, 85, 10, 2935);
    			add_location(h3, file$2, 84, 8, 2920);
    			attr_dev(div2, "class", "float-right");
    			add_location(div2, file$2, 83, 6, 2886);
    			attr_dev(div3, "class", "clearfix");
    			add_location(div3, file$2, 74, 4, 2571);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$2, 89, 4, 2996);
    			attr_dev(section, "class", "container");
    			add_location(section, file$2, 61, 2, 2289);
    			attr_dev(main, "class", "wrapper");
    			add_location(main, file$2, 60, 0, 2264);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section);
    			append_dev(section, div0);
    			append_dev(div0, iframe);
    			append_dev(section, t0);
    			append_dev(section, br);
    			append_dev(section, t1);
    			append_dev(section, div3);
    			append_dev(div3, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			append_dev(div1, t5);
    			append_dev(div1, button2);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, h3);
    			append_dev(h3, tt);
    			append_dev(tt, t8);
    			append_dev(section, t9);
    			append_dev(section, div4);
    			mount_component(doc, div4, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(iframe, "load", /*init*/ ctx[1], false, false, false),
    					listen_dev(button0, "click", /*save*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*cancel*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*del*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$source*/ 1) set_data_dev(t8, /*$source*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(doc.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(doc.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(doc);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $source;
    	let $ow;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(0, $source = $$value));
    	validate_store(ow, "ow");
    	component_subscribe($$self, ow, $$value => $$invalidate(6, $ow = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Editor", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let editor;

    	function init() {
    		return __awaiter(this, void 0, void 0, function* () {
    			editor = window.frames[0];
    			let filename = $source;
    			console.log(filename);
    			let code = yield $ow.load(filename);
    			console.log(code);
    			editor.setValue(filename, code);
    		});
    	}

    	function cancel() {
    		if (confirm("Are you sure you want to lose your changes?")) {
    			editor.setValue("", "");
    			source.set("");
    		}
    	}

    	function del() {
    		return __awaiter(this, void 0, void 0, function* () {
    			let name = $source;
    			name = name.split(".")[0];
    			let namespace = $ow.namespace;
    			let botname = namespace.split("-")[0] + "/" + name;

    			if (confirm("Are you sure you want to delete this Robot?")) {
    				$ow.del($source).then(() => {
    					editor.setValue("", "");
    					source.set("");
    				});
    			}
    		});
    	}

    	function save() {
    		return __awaiter(this, void 0, void 0, function* () {
    			let name = $source;
    			name = name.split(".")[0];
    			let namespace = $ow.namespace;
    			namespace = namespace.split("-")[0];
    			let code = yield editor.getValue();

    			//console.log(code);
    			$ow.save($source, code, true).then(() => {
    				source.set("");
    			});

    			yield rumbleSave(`${$ow.namespace}:${$source}`, code);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		__awaiter,
    		ow,
    		Doc,
    		source,
    		rumbleSave,
    		editor,
    		init,
    		cancel,
    		del,
    		save,
    		$source,
    		$ow
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("editor" in $$props) editor = $$props.editor;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$source, init, cancel, del, save];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */

    // (29:0) {:else}
    function create_else_block$1(ctx) {
    	let editor;
    	let current;
    	editor = new Editor({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(editor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editor, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(29:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:0) {#if $source == ""}
    function create_if_block$1(ctx) {
    	let field;
    	let current;

    	field = new Field({
    			props: {
    				base: /*base*/ ctx[2],
    				namespace: /*namespace*/ ctx[1],
    				apihost: /*apihost*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(field.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(field, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(field, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(27:0) {#if $source == \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$source*/ ctx[0] == "") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $source;
    	validate_store(source, "source");
    	component_subscribe($$self, source, $$value => $$invalidate(0, $source = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let url = new URL(location.href);

    	// remove the index.html
    	let a = url.pathname.split("/");

    	let namespace = a[a.length - 4];
    	url.pathname = a.slice(0, -1).join("/");

    	// if the location.host is localhost:5000 you are in development mode
    	// you need a surgery to contact the locally running openwhisk
    	if (location.host == "localhost:5000") {
    		url.port = "3233";
    	}

    	// get base and apihost
    	let base = url.href;

    	url.pathname = "";
    	let apihost = url.href.slice(0, -1);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Field,
    		Editor,
    		source,
    		url,
    		a,
    		namespace,
    		base,
    		apihost,
    		$source
    	});

    	$$self.$inject_state = $$props => {
    		if ("url" in $$props) url = $$props.url;
    		if ("a" in $$props) a = $$props.a;
    		if ("namespace" in $$props) $$invalidate(1, namespace = $$props.namespace);
    		if ("base" in $$props) $$invalidate(2, base = $$props.base);
    		if ("apihost" in $$props) $$invalidate(3, apihost = $$props.apihost);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$source, namespace, base, apihost];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=main.js.map
