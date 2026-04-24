const LOGIN_BRANDING_STYLE_ID = "kupkompa-admin-login-branding"
const kupkompaLogoUrl = new URL("./assets/kupkompa-logo.svg", import.meta.url).href

const ensureLoginBrandingStyles = () => {
  if (document.getElementById(LOGIN_BRANDING_STYLE_ID)) {
    return
  }

  const style = document.createElement("style")
  style.id = LOGIN_BRANDING_STYLE_ID
  style.textContent = `
    .kupkompa-admin-login-logo-host {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .kupkompa-admin-login-logo {
      display: block;
      width: min(240px, 100%);
      height: auto;
    }
  `

  document.head.appendChild(style)
}

const isLoginPath = () => {
  const pathname = window.location.pathname.replace(/\/+$/, "")
  return pathname.endsWith("/app/login")
}

const getLoginForm = () => {
  const forms = Array.from(document.querySelectorAll("form"))

  return forms.find((form) => {
    const inputs = Array.from(form.querySelectorAll("input"))

    return (
      inputs.some((input) => input.autocomplete === "email") &&
      inputs.some(
        (input) =>
          input.type === "password" || input.autocomplete === "current-password"
      )
    )
  })
}

const applyLoginBranding = () => {
  if (!isLoginPath()) {
    return
  }

  const form = getLoginForm()

  if (!form) {
    return
  }

  const formContainer = form.parentElement
  const headingBlock = formContainer?.previousElementSibling
  const logoHost = headingBlock?.previousElementSibling

  if (!(logoHost instanceof HTMLElement)) {
    return
  }

  if (logoHost.dataset.kupkompaBrandingApplied === "true") {
    return
  }

  ensureLoginBrandingStyles()

  const logo = document.createElement("img")
  logo.src = kupkompaLogoUrl
  logo.alt = "Kupkompa"
  logo.className = "kupkompa-admin-login-logo"

  logoHost.replaceChildren(logo)
  logoHost.classList.add("kupkompa-admin-login-logo-host")
  logoHost.dataset.kupkompaBrandingApplied = "true"
}

const bootLoginBranding = () => {
  const observer = new MutationObserver(() => {
    applyLoginBranding()
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })

  applyLoginBranding()

  window.addEventListener("popstate", applyLoginBranding)
  window.addEventListener("hashchange", applyLoginBranding)
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootLoginBranding, {
      once: true,
    })
  } else {
    bootLoginBranding()
  }
}
