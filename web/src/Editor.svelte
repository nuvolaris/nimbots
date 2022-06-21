<script lang="ts">
  import { ow } from "./store";
  import Doc from "./Doc.svelte";
  import { source } from "./store";
  import { rumbleSave } from "./rumble";

  let editor: Editor;

  interface Editor extends Window {
    setValue: (filename: string, code: string) => void;
    getValue: () => string;
  }

  async function init() {
    editor = window.frames[0] as Editor;
    let filename = $source;
    console.log(filename)
    let code = await $ow.load(filename);
    console.log(code)
    editor.setValue(filename, code);
  }

  function cancel() {
    if (confirm("Are you sure you want to lose your changes?")) {
      editor.setValue("", "");
      source.set("");
    }
  }

  async function del() {
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
  }

  async function save() {
    let name = $source;
    name = name.split(".")[0];
    let namespace = $ow.namespace;
    namespace = namespace.split("-")[0];

    let code = await editor.getValue();
    //console.log(code);
    $ow.save($source, code, true).then(() => {
      source.set("");
    });
    await rumbleSave(`${$ow.namespace}:${$source}`, code);
  }
</script>

<main class="wrapper">
  <section class="container">
    <div class="row">
      <iframe
        on:load={init}
        title="editor"
        id="editor"
        src="editor.html"
        style="height: 500px; width: 100%;"
        frameborder="0"
        scrolling="no"
      />
    </div>
    <br />
    <div class="clearfix">
      <!-- Float either directions -->
      <div class="float-left">
        <button id="done" on:click={save}>Save</button>
        &nbsp;
        <button id="done" on:click={cancel}>Cancel</button>
        &nbsp;
        <button id="done" on:click={del}>Delete</button>
      </div>
      <div class="float-right">
        <h3>
          <tt>{$source}</tt>
        </h3>
      </div>
    </div>
    <div class="row">
      <Doc />
    </div>
  </section>
</main>
