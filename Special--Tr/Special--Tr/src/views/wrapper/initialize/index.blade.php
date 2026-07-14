@if($n_init != "{version}")
  <style class="init-error-style">@import url("/extensions/nebula/libraries/initStyles.css?t={timestamp}");</style>
  @if(Auth::check() != true)
    @include('blueprint.extensions.nebula.wrapper.initialize.auth')
  @else
    @if(Auth::user()->root_admin == 1)
      <div class="init-error-bg">
        <div class="init-error-overlay">
          <div class="nebula-onboarding-container">
            <p class="nebula-onboarding-icon">
              <i class="bi bi-exclude"></i>
              <span>SKA Host</span>
            </p>
            <div class="nebula-onboarding-content">
              <p class="nebula-onboarding-text">Greetings traveler, welcome to <b>SKA Host</b>! Get started by <i>customizing</i> your Pterodactyl appearance in <b>SKA Host Designer</b>.</p>
              <p align="center"><a href="/admin/extensions/nebula"><button type="button" class="nebula-onboarding-button">Get started <i class="bi bi-arrow-right"></i></button></a></p>
            </div>
          </div>
        </div>
      </div>
    @else
      <div class="init-error-bg">
        <div class="init-error-overlay">
          <p>You do not have administrator permissions on this panel and are thus unable to configure SKA Host. Please wait for an administrator to configure SKA Host for you to be able to manage your servers again.</p>
        </div>
      </div>
    @endif
  @endif
@endif