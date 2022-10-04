defmodule RidexWeb.CellChannel do
  use RidexWeb, :channel

  def join("cell:" <> _geohash, _params, socket) do
    {:ok, %{}, socket}
  end
end
