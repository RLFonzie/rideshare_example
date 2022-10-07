defmodule RidexWeb.UserChannel do
  use RidexWeb, :channel
  require Logger

  def join("user:" <> user_id, _params, socket) do
    %{id: id} = socket.assigns[:current_user]

    # Logger.info "Logging user id"
    # Logger.debug "user id: #{inspect(String.to_integer(user_id))}"
    # Logger.debug "id: #{inspect(id)}"
    if id == String.to_integer(user_id),
      do: {:ok, socket},
      else: {:error, :unauthorized}
  end

  def handle_in("update_position", %{"lat" => lat, "lng" => lng}, socket) do
    user = socket.assigns[:current_user]
    RidexWeb.Presence.update(socket, user.id, %{
      lat: lat,
      lng: lng
    })

    {:noreply, socket}
  end
end
