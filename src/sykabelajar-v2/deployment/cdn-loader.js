export function loadAsset(url){
  const script = document.createElement("script");
  script.src = url;
  document.head.appendChild(script);
}
