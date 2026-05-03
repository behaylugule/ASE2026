/** Runs before paint to avoid theme flash; keeps default light. */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("arxiv-theme");if(t!=="dark"&&t!=="light")t="light";document.documentElement.setAttribute("data-mock-theme",t);}catch(e){document.documentElement.setAttribute("data-mock-theme","light");}})();`,
      }}
    />
  );
}
