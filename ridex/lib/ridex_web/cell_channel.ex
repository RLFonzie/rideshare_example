defmodule RidexWeb.CellChannel do
  use RidexWeb, :channel
  require Logger

  def join("cell:" <> _geohash, %{"position" => position}, socket) do
    # Logger.debug "position: #{inspect(position)}"
    send(self(), {:after_join, position})
    {:ok, socket}
  end

  # def join("cell:" <> _geohash, _params, socket) do
  #   Logger.debug "params: #{inspect(_params)}"
  #   {:ok, %{}, socket}
  # end

  def handle_info({:after_join, position}, socket) do
    user = socket.assigns[:current_user]

    if user.type == "driver" do
      RidexWeb.Presence.track(socket, user.id, %{
        lat: position["lat"],
        lng: position["lng"]
      })
    end

    push(socket, "presence_state", RidexWeb.Presence.list(socket))

    {:noreply, socket}
  end
end
