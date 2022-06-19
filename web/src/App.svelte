<script lang="ts">
  import "normalize.css/normalize.css";
  import "milligram/dist/milligram.min.css";
  import "./style.css";

  import Field from "./Field.svelte";
  import Editor from "./Editor.svelte";
  import { OpenWhisk } from "./openwhisk";
  
  import { source, rewards, share } from "./store";
  // decode login
  let url = new URL(location.href);
  let ow: OpenWhisk = undefined;


  if (url.hash.length > 1) {
    console.log(url.hash);
    localStorage.setItem("referrer", url.hash.substring(1));
    url.hash = "";
    location.href = url.href;
  }

  // calculate api server location
  let apiserver = "apigcp.nimbella.io";
  let path = "/api/v1/web/";
  let base = "https://" + apiserver + path;
</script>

{#if $source == ""}
  <Field {base} {ow} />
{:else}
  <Editor {ow} />`
{/if}
