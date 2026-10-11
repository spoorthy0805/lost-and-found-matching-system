
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ReportFound() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    date: "",
  });

  const [message, setMessage] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

 
async function handleSubmit(e) {
  e.preventDefault();
  setMessage("Saving item...");

  try {
    const response = await fetch("/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        item_type: "FOUND",
      }),
    });

    const data = await response.json();

    if (data.success) {
      setMessage("Found item saved successfully!");
      setForm({
        title: "",
        description: "",
        category: "",
        location: "",
        date: "",
      });
    } else {
      setMessage(data.message || "Failed to save item.");
    }
  } catch (error) {
    setMessage("Could not connect to the server.");
  }
}


  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-blue-700 hover:underline">
          ← Back to Home
        </Link>

        <div className="mt-8 rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Report Found Item
          </h1>

          <p className="mb-8 text-gray-600">
            Enter the details of the item you found.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block font-medium text-gray-800">
                Item Name
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. Blue Water Bottle"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-800">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe the item you found..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-800">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
              >
                <option value="">Select a category</option>
                <option value="1">Electronics</option>
                <option value="2">Accessories</option>
                <option value="3">Bags</option>
                <option value="4">Documents</option>
                <option value="5">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-800">
                Location Found
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                placeholder="e.g. Library"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-800">
                Date Found
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                max={new Date().toLocaleDateString("en-CA")}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Submit Found Item
            </button>

            {message && (
              <p className="text-center text-blue-700">{message}</p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
