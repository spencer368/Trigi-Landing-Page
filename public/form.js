document.getElementById("teardown-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button");
  const email = form.querySelector("#e").value.trim();
  const name = form.querySelector("#n").value.trim();
  const company = form.querySelector("#c").value.trim();
  const role = form.querySelector("#r").value;
  const agents = [...form.querySelectorAll(".boxes input:checked")].map((input) =>
    input.parentElement.textContent.trim(),
  );

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    button.textContent = "Enter a work email";
    return;
  }

  button.disabled = true;
  try {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, company, role, agents }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      button.disabled = false;
      button.textContent = data.error || "Something went wrong. Try again.";
      return;
    }
    button.textContent = "Thanks, we’ll be in touch";
  } catch {
    button.disabled = false;
    button.textContent = "Network error. Try again.";
  }
});
